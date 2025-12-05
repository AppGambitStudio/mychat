import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import ChatSpace from './ChatSpace';

interface DailyStatAttributes {
    id: string;
    chat_space_id: string;
    date: string;
    total_loads: number;
    total_chats: number;
    total_messages: number;
    unique_users: number;
    created_at?: Date;
    updated_at?: Date;
}

interface DailyStatCreationAttributes extends Optional<DailyStatAttributes, 'id' | 'total_loads' | 'total_chats' | 'total_messages' | 'unique_users'> { }

class DailyStat extends Model<DailyStatAttributes, DailyStatCreationAttributes> implements DailyStatAttributes {
    public id!: string;
    public chat_space_id!: string;
    public date!: string;
    public total_loads!: number;
    public total_chats!: number;
    public total_messages!: number;
    public unique_users!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

DailyStat.init(
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        total_loads: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_chats: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_messages: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        unique_users: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'daily_stats',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['chat_space_id', 'date']
            }
        ]
    }
);

export default DailyStat;
