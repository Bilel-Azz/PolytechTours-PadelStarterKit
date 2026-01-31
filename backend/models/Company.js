// ============================================
// FICHIER : backend/models/Company.js
// ============================================

module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('Company', {
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        logoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'logo_url',
        },
        contactEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'contact_email',
            validate: {
                isEmail: {
                    msg: 'Email invalide',
                },
            },
        },
        contactPhone: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'contact_phone',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        tableName: 'companies',
        timestamps: true,
        underscored: true,
    });

    Company.associate = (models) => {
        // Has many Players
        Company.hasMany(models.Player, {
            foreignKey: 'company_id',
            as: 'players',
        });

        // Has many Teams
        Company.hasMany(models.Team, {
            foreignKey: 'company_id',
            as: 'teams',
        });
    };

    return Company;
};
