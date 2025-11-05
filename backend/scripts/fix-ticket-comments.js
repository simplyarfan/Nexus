const database = require('../models/database');

async function fixTicketComments() {
  console.log('🔧 Starting ticket comments cleanup...\n');

  try {
    // 1. Find comments with invalid ticket_id
    console.log('📊 Finding comments with invalid ticket_id...');
    const invalidComments = await database.all(`
      SELECT tc.id, tc.ticket_id, tc.user_id, tc.comment, tc.created_at,
             u.email, u.first_name, u.last_name
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = 0 OR tc.ticket_id IS NULL
      ORDER BY tc.created_at DESC
    `);

    console.log(`Found ${invalidComments.length} comments with invalid ticket_id\n`);

    if (invalidComments.length > 0) {
      console.log('❌ Invalid Comments:');
      invalidComments.forEach((comment) => {
        console.log(
          `  ID: ${comment.id} | ticket_id: ${comment.ticket_id} | User: ${comment.email} | Comment: "${comment.comment.substring(0, 50)}..."`,
        );
      });
      console.log('');
    }

    // 2. Find all tickets to help match comments
    console.log('📋 Fetching all tickets...');
    const tickets = await database.all(`
      SELECT st.id, st.subject, st.user_id, u.email, u.first_name, u.last_name
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      ORDER BY st.id DESC
    `);

    console.log(`Found ${tickets.length} tickets\n`);

    // 3. Try to auto-fix comments by matching user_id
    console.log('🔄 Attempting to auto-fix comments...');
    let fixedCount = 0;

    for (const comment of invalidComments) {
      // Find tickets created by the same user
      const userTickets = tickets.filter((t) => t.user_id === comment.user_id);

      if (userTickets.length === 1) {
        // Only one ticket from this user, safe to assign
        const ticketId = userTickets[0].id;
        await database.run(
          `
          UPDATE ticket_comments 
          SET ticket_id = $1 
          WHERE id = $2
        `,
          [ticketId, comment.id],
        );

        console.log(
          `✅ Fixed comment ${comment.id} → assigned to ticket ${ticketId} (${userTickets[0].subject})`,
        );
        fixedCount++;
      } else if (userTickets.length > 1) {
        console.log(
          `⚠️  Comment ${comment.id} - User has ${userTickets.length} tickets, manual review needed:`,
        );
        userTickets.forEach((t) => {
          console.log(`     - Ticket ${t.id}: ${t.subject}`);
        });
      } else {
        console.log(`❌ Comment ${comment.id} - No tickets found for user ${comment.email}`);
      }
    }

    console.log(`\n✅ Auto-fixed ${fixedCount} comments\n`);

    // 4. Check for remaining invalid comments
    const remainingInvalid = await database.all(`
      SELECT COUNT(*) as count
      FROM ticket_comments
      WHERE ticket_id = 0 OR ticket_id IS NULL
    `);

    const remaining = remainingInvalid[0].count;
    console.log(`📊 Remaining invalid comments: ${remaining}\n`);

    // 5. Show statistics
    console.log('📊 Final Statistics:');
    const stats = await database.all(`
      SELECT 
        st.id as ticket_id,
        st.subject,
        COUNT(tc.id) as comment_count
      FROM support_tickets st
      LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
      GROUP BY st.id, st.subject
      ORDER BY st.id DESC
      LIMIT 10
    `);

    console.log('\nTop 10 tickets with comment counts:');
    stats.forEach((stat) => {
      console.log(`  Ticket ${stat.ticket_id}: ${stat.comment_count} comments - "${stat.subject}"`);
    });

    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fixTicketComments()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixTicketComments;
