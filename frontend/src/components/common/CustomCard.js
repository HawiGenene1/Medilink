import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

/**
 * CustomCard Component
 * Wrapper around Ant Design Card to enforce Design System styles.
 * 
 * properties:
 * - title: Card title (string or node)
 * - extra: Action items in header (node)
 * - noPadding: If true, removes body padding
 */
const CustomCard = ({ title, extra, children, className, noPadding, ...props }) => {
    return (
        <Card
            title={title}
            extra={extra}
            className={`custom-card ${className || ''}`}
            variant="borderless" // Border handled by CSS class
            bodyStyle={noPadding ? { padding: 0 } : {}}
            {...props}
        >
            {children}
        </Card>
    );
};

CustomCard.propTypes = {
    title: PropTypes.node,
    extra: PropTypes.node,
    className: PropTypes.string,
    noPadding: PropTypes.bool
};

export default CustomCard;
