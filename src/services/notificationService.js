const nodemailer = require('nodemailer');
const Family = require('../models/Family');
const User = require('../models/User');
const Expense = require('../models/Expense');

// Notification Service for email and in-app notifications

class NotificationService {
  constructor() {
    // Create reusable transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Send email notification
  async sendEmail(to, subject, html) {
    try {
      if (!process.env.SMTP_USER) {
        console.log('Email notification (SMTP not configured):', { to, subject });
        return { skipped: true };
      }
      
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }
  
  // Send budget alert notification
  async sendBudgetAlert(familyId, category, budget) {
    try {
      const family = await Family.findOne({ familyId }).populate('members.userId');
      
      if (!family) {
        throw new Error('Family not found');
      }
      
      const percentUsed = (budget.spent / budget.limit) * 100;
      
      const subject = `Budget Alert: ${category} at ${percentUsed.toFixed(0)}%`;
      const html = `
        <h2>Budget Alert for ${family.name}</h2>
        <p>The <strong>${category}</strong> budget has reached ${percentUsed.toFixed(0)}% of its limit.</p>
        <ul>
          <li>Limit: $${budget.limit.toFixed(2)}</li>
          <li>Spent: $${budget.spent.toFixed(2)}</li>
          <li>Remaining: $${(budget.limit - budget.spent).toFixed(2)}</li>
        </ul>
        <p>Please review your expenses to stay within budget.</p>
      `;
      
      // Send to all family members with notifications enabled
      const notifyMembers = await User.find({
        familyId,
        'preferences.notifications.budgetAlerts': true,
        isActive: true
      });
      
      for (const member of notifyMembers) {
        await this.sendEmail(member.email, subject, html);
      }
      
      return { sent: notifyMembers.length };
    } catch (error) {
      console.error('Budget alert error:', error);
      throw error;
    }
  }
  
  // Send expense approval request
  async sendApprovalRequest(expense) {
    try {
      const [user, family] = await Promise.all([
        User.findOne({ userId: expense.userId }),
        Family.findOne({ familyId: expense.familyId })
      ]);
      
      if (!family) {
        throw new Error('Family not found');
      }
      
      const subject = `Expense Approval Required: $${expense.amount}`;
      const html = `
        <h2>Expense Approval Request</h2>
        <p><strong>${user?.name || 'A family member'}</strong> has submitted an expense for approval:</p>
        <ul>
          <li>Amount: $${expense.amount.toFixed(2)}</li>
          <li>Category: ${expense.category}</li>
          <li>Description: ${expense.description || 'N/A'}</li>
          <li>Date: ${expense.date}</li>
        </ul>
        <p>Please log in to approve or reject this expense.</p>
      `;
      
      // Send to admins and parents
      const approvers = await User.find({
        familyId: expense.familyId,
        role: { $in: ['admin', 'parent'] },
        'preferences.notifications.approvalRequests': true,
        isActive: true
      });
      
      for (const approver of approvers) {
        await this.sendEmail(approver.email, subject, html);
      }
      
      return { sent: approvers.length };
    } catch (error) {
      console.error('Approval request error:', error);
      throw error;
    }
  }
  
  // Send family invitation
  async sendFamilyInvitation(email, familyName, inviteToken, inviterName) {
    try {
      const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;
      
      const subject = `You've been invited to join ${familyName}`;
      const html = `
        <h2>Family Expense Tracker Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join the family <strong>${familyName}</strong>.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <p>Or copy this link: ${inviteUrl}</p>
        <p>This invitation will expire in 7 days.</p>
      `;
      
      await this.sendEmail(email, subject, html);
      return { sent: true };
    } catch (error) {
      console.error('Invitation email error:', error);
      throw error;
    }
  }
  
  // Send weekly digest
  async sendWeeklyDigest(userId) {
    try {
      const user = await User.findOne({ userId });
      
      if (!user || !user.preferences.notifications.weeklyDigest) {
        return { skipped: true };
      }
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = weekAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      
      // Get user's expenses for the week
      const expenses = await Expense.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
        approvalStatus: 'approved',
        isDeleted: false
      });
      
      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      // Get category breakdown
      const categoryMap = {};
      expenses.forEach(exp => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
      });
      
      const categoryList = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `<li>${cat}: $${amt.toFixed(2)}</li>`)
        .join('');
      
      const subject = `Your Weekly Expense Summary`;
      const html = `
        <h2>Weekly Expense Summary</h2>
        <p>Here's your spending summary for the past week:</p>
        <h3>Total Spent: $${totalSpent.toFixed(2)}</h3>
        <p>Number of Expenses: ${expenses.length}</p>
        <h4>By Category:</h4>
        <ul>${categoryList}</ul>
        <p>Keep tracking your expenses to stay on budget!</p>
      `;
      
      await this.sendEmail(user.email, subject, html);
      return { sent: true };
    } catch (error) {
      console.error('Weekly digest error:', error);
      throw error;
    }
  }
  
  // Send expense approved notification
  async sendExpenseApproved(expenseId) {
    try {
      const expense = await Expense.findOne({ expenseId });
      
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      const user = await User.findOne({ userId: expense.userId });
      
      if (!user) {
        return { skipped: true };
      }
      
      const subject = `Expense Approved: $${expense.amount}`;
      const html = `
        <h2>Expense Approved</h2>
        <p>Your expense has been approved:</p>
        <ul>
          <li>Amount: $${expense.amount.toFixed(2)}</li>
          <li>Category: ${expense.category}</li>
          <li>Description: ${expense.description || 'N/A'}</li>
          <li>Date: ${expense.date}</li>
        </ul>
      `;
      
      await this.sendEmail(user.email, subject, html);
      return { sent: true };
    } catch (error) {
      console.error('Expense approved notification error:', error);
      throw error;
    }
  }
  
  // Send expense rejected notification
  async sendExpenseRejected(expenseId) {
    try {
      const expense = await Expense.findOne({ expenseId });
      
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      const user = await User.findOne({ userId: expense.userId });
      
      if (!user) {
        return { skipped: true };
      }
      
      const subject = `Expense Rejected: $${expense.amount}`;
      const html = `
        <h2>Expense Rejected</h2>
        <p>Your expense has been rejected:</p>
        <ul>
          <li>Amount: $${expense.amount.toFixed(2)}</li>
          <li>Category: ${expense.category}</li>
          <li>Description: ${expense.description || 'N/A'}</li>
          <li>Date: ${expense.date}</li>
        </ul>
        <p><strong>Reason:</strong> ${expense.rejectionReason || 'No reason provided'}</p>
      `;
      
      await this.sendEmail(user.email, subject, html);
      return { sent: true };
    } catch (error) {
      console.error('Expense rejected notification error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
