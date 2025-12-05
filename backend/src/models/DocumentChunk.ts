import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Document from './Document';
import ChatSpace from './ChatSpace';

interface DocumentChunkAttributes {
    id: string;
    document_id: string;
    chat_space_id: string;
    content: string;
    token_count?: number;
    embedding?: number[];
    metadata?: any;
    chunk_index?: number;
    created_at?: Date;
}

interface DocumentChunkCreationAttributes extends Optional<DocumentChunkAttributes, 'id'> { }

class DocumentChunk extends Model<DocumentChunkAttributes, DocumentChunkCreationAttributes> implements DocumentChunkAttributes {
    public id!: string;
    public document_id!: string;
    public chat_space_id!: string;
    public content!: string;
    public token_count!: number;
    public embedding!: number[];
    public metadata!: any;
    public chunk_index!: number;
    public readonly created_at!: Date;
}

DocumentChunk.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        document_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Document,
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        token_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        embedding: {
            type: DataTypes.ARRAY(DataTypes.FLOAT), // Using ARRAY(FLOAT) as fallback for VECTOR type definition in Sequelize
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        chunk_index: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'document_chunks',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
    }
);

export default DocumentChunk;
