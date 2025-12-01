const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function test() {
    try {
        const user = await User.findOne({ where: { email: 'admin@padel.com' } });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('Testing admin@padel.com...');
        const match = await bcrypt.compare('admin123', user.password_hash);
        console.log(`Password: "admin123" -> Match: ${match}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
