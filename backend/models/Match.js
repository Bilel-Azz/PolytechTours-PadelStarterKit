// ============================================
// FICHIER : backend/models/Match.js
// ============================================

module.exports = (sequelize, DataTypes) => {
    const Match = sequelize.define('Match', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'event_id',
            references: {
                model: 'events',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        team1Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'team1_id',
            references: {
                model: 'teams',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        team2Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'team2_id',
            references: {
                model: 'teams',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        courtNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'court_number',
            validate: {
                min: 1,
                max: 10,
            },
        },
        status: {
            type: DataTypes.ENUM('A_VENIR', 'TERMINE', 'ANNULE'),
            allowNull: false,
            defaultValue: 'A_VENIR',
        },
        scoreTeam1: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'score_team1',
        },
        scoreTeam2: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'score_team2',
        },
    }, {
        tableName: 'matches',
        timestamps: true,
        underscored: true,
        validate: {
            differentTeams() {
                if (this.team1Id === this.team2Id) {
                    throw new Error('Une équipe ne peut pas jouer contre elle-même');
                }
            },
        },
    });

    Match.associate = (models) => {
        // Belongs to Event
        Match.belongsTo(models.Event, {
            foreignKey: 'event_id',
            as: 'event',
        });

        // Belongs to Team (team1)
        Match.belongsTo(models.Team, {
            foreignKey: 'team1_id',
            as: 'team1',
        });

        // Belongs to Team (team2)
        Match.belongsTo(models.Team, {
            foreignKey: 'team2_id',
            as: 'team2',
        });
    };

    return Match;
};
