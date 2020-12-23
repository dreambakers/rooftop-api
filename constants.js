module.exports = {
    emailSenderName: 'Jules <jules@therooftop.nyc>',
    emailSubjects: {
        signupVerification: 'Verify your email',
        forgotPassword: 'Password reset request received',
    },
    emailTemplates: {
        signupVerification: 'signup-verification',
        forgotPassword: 'forgot-password',
    },
    bouroughs: ['Queens', 'Bronx', 'Brooklyn', 'Manhattan', 'Long Island'],
    crowdControls: ['Moshpit', 'Packed', 'Spaced', 'Kick back', 'Mixer'],
    partyTypes: {
        public: 'Public',
        private: 'Private'
    },
    venueSize: {
        min: 100,
        max: 10000
    }
}
