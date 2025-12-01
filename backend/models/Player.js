// ============================================
// FICHIER : backend/models/Player.js
// ============================================

module.exports = (sequelize, DataTypes) => {
    const Player = sequelize.define('Player', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'first_name',
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'last_name',
        },
        company: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        licenseNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'license_number',
            validate: {
                is: {
                    args: /^L\d{6}$/,
                    msg: 'Le numéro de licence doit être au format LXXXXXX',
                },
            },
        },
        birthDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'birth_date',
        },
        photoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'photo_url',
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
    }, {
        tableName: 'players',
        timestamps: true,
        underscored: true,
    });

    Player.associate = (models) => {
        // Belongs to User (optional - not all players have accounts)
        Player.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
        });

        // Has many Teams as player1
        Player.hasMany(models.Team, {
            foreignKey: 'player1_id',
            as: 'teamsAsPlayer1',
        });

        // Has many Teams as player2
        Player.hasMany(models.Team, {
            foreignKey: 'player2_id',
            as: 'teamsAsPlayer2',
        });
    };

    return Player;
};
