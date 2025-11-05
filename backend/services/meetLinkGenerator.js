/**
 * GOOGLE MEET LINK GENERATOR
 * Generates Google Meet links without requiring OAuth
 * Uses random slug generation for meet.google.com URLs
 */

class MeetLinkGenerator {
  /**
   * Generate a random Google Meet link
   * Format: https://meet.google.com/xxx-xxxx-xxx
   */
  generateMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';

    const generateSegment = (length) => {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };

    // Google Meet format: 3 chars - 4 chars - 3 chars
    const seg1 = generateSegment(3);
    const seg2 = generateSegment(4);
    const seg3 = generateSegment(3);

    return `https://meet.google.com/${seg1}-${seg2}-${seg3}`;
  }

  /**
   * Generate a Zoom-like link (if you want Zoom instead)
   */
  generateZoomLink() {
    const meetingId = Math.floor(100000000 + Math.random() * 900000000);
    return `https://zoom.us/j/${meetingId}`;
  }

  /**
   * Generate a Microsoft Teams link (placeholder)
   */
  generateTeamsLink() {
    const meetingId = Math.random().toString(36).substring(2, 15);
    return `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
  }

  /**
   * Get platform-specific link
   */
  generateLinkForPlatform(platform = 'Google Meet') {
    switch (platform.toLowerCase()) {
      case 'google meet':
      case 'meet':
        return this.generateMeetLink();
      case 'zoom':
        return this.generateZoomLink();
      case 'microsoft teams':
      case 'teams':
        return this.generateTeamsLink();
      default:
        return this.generateMeetLink();
    }
  }
}

module.exports = new MeetLinkGenerator();
