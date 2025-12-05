import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
    id: string;
    email: string;
    name?: string;
    password_hash?: string;
    avatar_url?: string;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    last_login_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'subscription_tier'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public name!: string;
    public password_hash!: string;
    public avatar_url!: string;
    public subscription_tier!: 'free' | 'pro' | 'enterprise';
    public last_login_at!: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        avatar_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        subscription_tier: {
            type: DataTypes.ENUM('free', 'pro', 'enterprise'),
            defaultValue: 'free',
        },
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default User;
