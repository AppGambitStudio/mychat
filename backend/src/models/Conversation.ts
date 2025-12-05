import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import ChatSpace from './ChatSpace';

interface ConversationAttributes {
    id: string;
    chat_space_id: string;
    end_user_id?: string;
    end_user_email?: string;
    end_user_name?: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    status: 'active' | 'closed' | 'archived';
    created_at?: Date;
    updated_at?: Date;
    closed_at?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'status'> { }

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
    public id!: string;
    public chat_space_id!: string;
    public end_user_id!: string;
    public end_user_email!: string;
    public end_user_name!: string;
    public ip_address!: string;
    public user_agent!: string;
    public referrer!: string;
    public status!: 'active' | 'closed' | 'archived';
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public closed_at!: Date;
}

Conversation.init(
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
        end_user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        end_user_email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        end_user_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.INET,
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        referrer: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'closed', 'archived'),
            defaultValue: 'active',
        },
        closed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'conversations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default Conversation;
