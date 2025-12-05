import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface SettingsAttributes {
    id: string;
    userId: string;
    responseTone: 'professional' | 'friendly' | 'concise' | 'detailed';
    kbConnectorUrl?: string;
    kbConnectorApiKey?: string;
    kbConnectorActive: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface SettingsCreationAttributes extends Optional<SettingsAttributes, 'id' | 'kbConnectorUrl' | 'kbConnectorApiKey' | 'kbConnectorActive' | 'responseTone'> { }

class Settings extends Model<SettingsAttributes, SettingsCreationAttributes> implements SettingsAttributes {
    public id!: string;
    public userId!: string;
    public responseTone!: 'professional' | 'friendly' | 'concise' | 'detailed';
    public kbConnectorUrl!: string;
    public kbConnectorApiKey!: string;
    public kbConnectorActive!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Settings.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        responseTone: {
            type: DataTypes.ENUM('professional', 'friendly', 'concise', 'detailed'),
            defaultValue: 'professional',
        },
        kbConnectorUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        kbConnectorApiKey: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        kbConnectorActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'Settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Define association
User.hasOne(Settings, { foreignKey: 'userId', as: 'settings' });
Settings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Settings;
