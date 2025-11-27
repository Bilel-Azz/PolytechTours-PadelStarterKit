// ============================================
// FICHIER : backend/models/Pool.js
// ============================================

module.exports = (sequelize, DataTypes) => {
    const Pool = sequelize.define('Pool', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, {
        tableName: 'pools',
        timestamps: true,
        underscored: true,
    });

    Pool.associate = (models) => {
        // Has many Teams
        Pool.hasMany(models.Team, {
            foreignKey: 'pool_id',
            as: 'teams',
        });
    };

    return Pool;
};
