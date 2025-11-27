const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function resetPassword() {
    try {
        const email = 'admin@padel.com';
        const newPassword = 'Admin@2025!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findOne({ where: { email } });
        if (user) {
            console.log('Old hash:', user.password_hash);
            user.password_hash = hashedPassword;
            await user.save();
            console.log(`Password for ${email} reset to ${newPassword}`);
            console.log('New hash:', user.password_hash);

            // Verify immediately
            const match = await bcrypt.compare(newPassword, user.password_hash);
            console.log('Immediate verification:', match);

            // Re-fetch and verify
            const user2 = await User.findOne({ where: { email } });
            const match2 = await bcrypt.compare(newPassword, user2.password_hash);
            console.log('Re-fetch verification:', match2);

        } else {
            console.log(`User ${email} not found`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

resetPassword();
