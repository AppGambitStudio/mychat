import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import ChatSpace from './ChatSpace';

interface AnalyticsEventAttributes {
    id: string;
    chat_space_id: string;
    event_type: 'widget_load' | 'chat_start' | 'message_sent' | 'feedback';
    anonymous_id?: string;
    metadata?: any;
    created_at?: Date;
}

interface AnalyticsEventCreationAttributes extends Optional<AnalyticsEventAttributes, 'id'> { }

class AnalyticsEvent extends Model<AnalyticsEventAttributes, AnalyticsEventCreationAttributes> implements AnalyticsEventAttributes {
    public id!: string;
    public chat_space_id!: string;
    public event_type!: 'widget_load' | 'chat_start' | 'message_sent' | 'feedback';
    public anonymous_id!: string;
    public metadata!: any;
    public readonly created_at!: Date;
}

AnalyticsEvent.init(
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
        event_type: {
            type: DataTypes.ENUM('widget_load', 'chat_start', 'message_sent', 'feedback'),
            allowNull: false,
        },
        anonymous_id: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'analytics_events',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
    }
);

export default AnalyticsEvent;
