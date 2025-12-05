import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Conversation from './Conversation';
import ChatSpace from './ChatSpace';

interface MessageAttributes {
    id: string;
    conversation_id: string;
    chat_space_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    tokens_used?: number;
    processing_time_ms?: number;
    context_chunks?: any;
    created_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> { }

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    public id!: string;
    public conversation_id!: string;
    public chat_space_id!: string;
    public role!: 'user' | 'assistant' | 'system';
    public content!: string;
    public model!: string;
    public tokens_used!: number;
    public processing_time_ms!: number;
    public context_chunks!: any;
    public readonly created_at!: Date;
}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        conversation_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Conversation,
                key: 'id',
            },
        },
        chat_space_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: ChatSpace,
                key: 'id',
            },
        },
        role: {
            type: DataTypes.ENUM('user', 'assistant', 'system'),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tokens_used: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        processing_time_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        context_chunks: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'messages',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
    }
);

export default Message;
