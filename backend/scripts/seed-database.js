const database = require('../models/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await database.connect();

    // Check if users already exist
    const existingUsers = await database.all('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 1) {
      console.log('📊 Database already has users, skipping seeding');
      return;
    }

    console.log('👥 Creating test users...');

    // Create test users
    const testUsers = [
      {
        email: 'john.doe@securemaxtech.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        department: 'Human Resources',
        job_title: 'HR Manager',
        role: 'user',
      },
      {
        email: 'jane.smith@securemaxtech.com',
        password: 'password123',
        first_name: 'Jane',
        last_name: 'Smith',
        department: 'Finance',
        job_title: 'Financial Analyst',
        role: 'user',
      },
      {
        email: 'mike.johnson@securemaxtech.com',
        password: 'password123',
        first_name: 'Mike',
        last_name: 'Johnson',
        department: 'Sales & Marketing',
        job_title: 'Sales Manager',
        role: 'user',
      },
      {
        email: 'sarah.wilson@securemaxtech.com',
        password: 'password123',
        first_name: 'Sarah',
        last_name: 'Wilson',
        department: 'IT',
        job_title: 'Software Developer',
        role: 'user',
      },
    ];

    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await database.run(
        `
        INSERT INTO users (email, password_hash, first_name, last_name, department, job_title, role, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
      `,
        [
          user.email,
          hashedPassword,
          user.first_name,
          user.last_name,
          user.department,
          user.job_title,
          user.role,
          true,
        ],
      );

      console.log(`✅ Created user: ${user.email}`);
    }

    console.log('🎫 Creating test support tickets...');

    // Get user IDs for ticket creation
    const users = await database.all(
      "SELECT id, email FROM users WHERE email LIKE '%@securemaxtech.com'",
    );

    const testTickets = [
      {
        subject: 'Login Issues with CV Intelligence',
        description:
          'I am unable to access the CV Intelligence module. Getting authentication errors.',
        priority: 'high',
        category: 'technical',
        status: 'open',
      },
      {
        subject: 'Feature Request: Export CV Analysis',
        description:
          'Would like to export CV analysis results to PDF format for sharing with clients.',
        priority: 'medium',
        category: 'feature',
        status: 'in_progress',
      },
      {
        subject: 'Account Access Request',
        description: 'New employee needs access to the Finance dashboard and related tools.',
        priority: 'medium',
        category: 'account',
        status: 'open',
      },
      {
        subject: 'System Performance Issues',
        description: 'The platform has been running slowly, especially during batch CV processing.',
        priority: 'high',
        category: 'technical',
        status: 'resolved',
      },
      {
        subject: 'General Support Question',
        description: 'How do I change my department settings in my profile?',
        priority: 'low',
        category: 'general',
        status: 'closed',
      },
    ];

    for (let i = 0; i < testTickets.length; i++) {
      const ticket = testTickets[i];
      const user = users[i % users.length]; // Cycle through users

      await database.run(
        `
        INSERT INTO support_tickets (user_id, subject, description, priority, category, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          user.id,
          ticket.subject,
          ticket.description,
          ticket.priority,
          ticket.category,
          ticket.status,
        ],
      );

      console.log(`✅ Created ticket: ${ticket.subject}`);
    }

    console.log('🧠 Creating test CV batches...');

    // Create test CV batches
    const testBatches = [
      {
        name: 'Software Developer Candidates - Q4 2024',
        user_id: users[0].id,
        status: 'completed',
        candidate_count: 15,
        processed_count: 15,
      },
      {
        name: 'Marketing Team Recruitment',
        user_id: users[1].id,
        status: 'processing',
        candidate_count: 8,
        processed_count: 5,
      },
      {
        name: 'Finance Department Interns',
        user_id: users[2].id,
        status: 'pending',
        candidate_count: 12,
        processed_count: 0,
      },
    ];

    for (const batch of testBatches) {
      await database.run(
        `
        INSERT INTO cv_batches (name, user_id, status, candidate_count, processed_count)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [batch.name, batch.user_id, batch.status, batch.candidate_count, batch.processed_count],
      );

      console.log(`✅ Created CV batch: ${batch.name}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${testUsers.length}`);
    console.log(`   - Support Tickets: ${testTickets.length}`);
    console.log(`   - CV Batches: ${testBatches.length}`);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
