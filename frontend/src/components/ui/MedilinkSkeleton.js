import React from 'react';
import { Skeleton, Card } from 'antd';
import './MedilinkSkeleton.css';

const MedilinkSkeleton = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = (index) => {
        switch (type) {
            case 'card':
                return (
                    <Card key={index} className="medilink-skeleton-card" variant="borderless">
                        <Skeleton active avatar paragraph={{ rows: 2 }} />
                    </Card>
                );
            case 'list':
                return (
                    <div key={index} className="medilink-skeleton-list-item">
                        <Skeleton active avatar paragraph={{ rows: 1 }} />
                    </div>
                );
            case 'medicine':
                return (
                    <Card key={index} className="medilink-skeleton-medicine" cover={<div className="skeleton-image-placeholder" />}>
                        <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                    </Card>
                );
            case 'text':
                return <Skeleton key={index} active paragraph={{ rows: 3 }} />;
            default:
                return <Skeleton key={index} active />;
        }
    };

    return (
        <div className={`medilink-skeleton-container skeleton-${type}`}>
            {[...Array(count)].map((_, i) => renderSkeleton(i))}
        </div>
    );
};

export default MedilinkSkeleton;
