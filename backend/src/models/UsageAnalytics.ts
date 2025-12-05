import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import ChatSpace from './ChatSpace';
import User from './User';

interface UsageAnalyticsAttributes {
    id: string;
    chat_space_id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    message_count: number;
    conversation_count: number;
    unique_users: number;
    total_tokens_used: number;
    total_cost_usd: number;
    created_at?: Date;
}

interface UsageAnalyticsCreationAttributes extends Optional<UsageAnalyticsAttributes, 'id' | 'message_count' | 'conversation_count' | 'unique_users' | 'total_tokens_used' | 'total_cost_usd'> { }

class UsageAnalytics extends Model<UsageAnalyticsAttributes, UsageAnalyticsCreationAttributes> implements UsageAnalyticsAttributes {
    public id!: string;
    public chat_space_id!: string;
    public user_id!: string;
    public date!: string;
    public message_count!: number;
    public conversation_count!: number;
    public unique_users!: number;
    public total_tokens_used!: number;
    public total_cost_usd!: number;
    public readonly created_at!: Date;
}

UsageAnalytics.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        chat_space_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: ChatSpace,
                key: 'id',
            },
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        message_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        conversation_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        unique_users: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_tokens_used: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_cost_usd: {
            type: DataTypes.DECIMAL(10, 4),
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'usage_analytics',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
        indexes: [
            {
                unique: true,
                fields: ['chat_space_id', 'date'],
            },
        ],
    }
);

export default UsageAnalytics;
