const { User } = require('./models');

async function inspectUsers() {
    try {
        const users = await User.findAll();
        console.log('Found', users.length, 'users');
        users.forEach(user => {
            console.log('User:', user.email, 'Role:', user.role, 'Hash:', user.password_hash);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

inspectUsers();
