import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import ChatSpace from './ChatSpace';

interface DocumentAttributes {
    id: string;
    chat_space_id: string;
    type: 'pdf' | 'url' | 'text';
    source_url?: string;
    file_name?: string;
    text_content?: string;
    file_size?: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processing_started_at?: Date;
    processing_completed_at?: Date;
    error_message?: string;
    title?: string;
    author?: string;
    page_count?: number;
    word_count?: number;
    created_at?: Date;
    updated_at?: Date;
}

interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'status'> { }

class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
    public id!: string;
    public chat_space_id!: string;
    public type!: 'pdf' | 'url' | 'text';
    public source_url!: string;
    public file_name!: string;
    public text_content!: string;
    public file_size!: number;
    public status!: 'pending' | 'processing' | 'completed' | 'failed';
    public processing_started_at!: Date;
    public processing_completed_at!: Date;
    public error_message!: string;
    public title!: string;
    public author!: string;
    public page_count!: number;
    public word_count!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Document.init(
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
        type: {
            type: DataTypes.ENUM('pdf', 'url', 'text'),
            allowNull: false,
        },
        source_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        text_content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        file_size: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
            defaultValue: 'pending',
        },
        processing_started_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        processing_completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        author: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        page_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        word_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'documents',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default Document;
