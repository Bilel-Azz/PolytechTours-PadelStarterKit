// ============================================
// FICHIER : backend/models/Event.js
// ============================================

module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        eventDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'event_date',
        },
        eventTime: {
            type: DataTypes.TIME,
            allowNull: false,
            field: 'event_time',
        },
    }, {
        tableName: 'events',
        timestamps: true,
        underscored: true,
    });

    Event.associate = (models) => {
        // Has many Matches
        Event.hasMany(models.Match, {
            foreignKey: 'event_id',
            as: 'matches',
            onDelete: 'CASCADE',
        });
    };

    return Event;
};
