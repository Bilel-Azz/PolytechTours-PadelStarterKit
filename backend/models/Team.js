// ============================================
// FICHIER : backend/models/Team.js
// ============================================

module.exports = (sequelize, DataTypes) => {
    const Team = sequelize.define('Team', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        company: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        player1Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'player1_id',
            references: {
                model: 'players',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        player2Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'player2_id',
            references: {
                model: 'players',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        poolId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'pool_id',
            references: {
                model: 'pools',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        tableName: 'teams',
        timestamps: true,
        underscored: true,
        validate: {
            differentPlayers() {
                if (this.player1Id && this.player2Id && this.player1Id === this.player2Id) {
                    throw new Error('Les deux joueurs doivent être différents');
                }
            },
        },
    });

    Team.associate = (models) => {
        // Belongs to Player (player1)
        Team.belongsTo(models.Player, {
            foreignKey: 'player1_id',
            as: 'player1',
        });

        // Belongs to Player (player2)
        Team.belongsTo(models.Player, {
            foreignKey: 'player2_id',
            as: 'player2',
        });

        // Belongs to Pool
        Team.belongsTo(models.Pool, {
            foreignKey: 'pool_id',
            as: 'pool',
        });

        // Has many matches as team1
        Team.hasMany(models.Match, {
            foreignKey: 'team1_id',
            as: 'matchesAsTeam1',
        });

        // Has many matches as team2
        Team.hasMany(models.Match, {
            foreignKey: 'team2_id',
            as: 'matchesAsTeam2',
        });
    };

    return Team;
};
