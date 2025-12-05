import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface ChatSpaceAttributes {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: 'draft' | 'processing' | 'published' | 'archived';
    widget_status: 'testing' | 'live' | 'maintenance';
    endpoint_slug?: string;
    api_key?: string;
    widget_config?: any;
    ai_config?: any;
    message_count: number;
    last_message_at?: Date;
    published_at?: Date;
    last_processed_at?: Date;
    data_usage_bytes: number;
    created_at?: Date;
    updated_at?: Date;
}

interface ChatSpaceCreationAttributes extends Optional<ChatSpaceAttributes, 'id' | 'status' | 'widget_status' | 'message_count' | 'widget_config' | 'ai_config'> { }

class ChatSpace extends Model<ChatSpaceAttributes, ChatSpaceCreationAttributes> implements ChatSpaceAttributes {
    public id!: string;
    public user_id!: string;
    public name!: string;
    public description!: string;
    public status!: 'draft' | 'processing' | 'published' | 'archived';
    public widget_status!: 'testing' | 'live' | 'maintenance';
    public endpoint_slug!: string;
    public api_key!: string;
    public widget_config!: any;
    public ai_config!: any;
    public message_count!: number;
    public last_message_at!: Date;
    public published_at!: Date;
    public last_processed_at!: Date;
    public data_usage_bytes!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ChatSpace.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'processing', 'published', 'archived'),
            defaultValue: 'draft',
        },
        widget_status: {
            type: DataTypes.ENUM('testing', 'live', 'maintenance'),
            defaultValue: 'testing',
        },
        endpoint_slug: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
        },
        api_key: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
        },
        widget_config: {
            type: DataTypes.JSONB,
            defaultValue: {
                theme: "light",
                primaryColor: "#3B82F6",
                position: "bottom-right",
                welcomeMessage: "Hi! How can I help you?",
                placeholder: "Type your message...",
                botName: "Assistant",
                botAvatar: null
            },
        },
        ai_config: {
            type: DataTypes.JSONB,
            defaultValue: {
                model: "gpt-3.5-turbo",
                temperature: 0.7,
                maxTokens: 500,
                systemPrompt: "You are a helpful assistant."
            },
        },
        message_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        last_message_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        published_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_processed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        data_usage_bytes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'chat_spaces',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default ChatSpace;
