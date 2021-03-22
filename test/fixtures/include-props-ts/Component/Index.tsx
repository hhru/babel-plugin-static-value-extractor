import React, { FC } from 'react';
import AdditionalComponent from './AdditionalComponent';
import IncludeFolder from '../IncludeFolder';

const CustomProps = {
    bar: 'const-customProps-1',
    foo: 'const-customProps-2',
    nested: {
        bar: 'const-customProps-3',
        foo: 'const-customProps-4',
    },
};

interface MyCompProps {
    text: string;
}

interface StaticProps {
    customProps: {
        [k: string]: string;
    };
}

const Component: FC<MyCompProps> & StaticProps = ({ text }) => text;

Component.customProps = {
    bar: 'customProps-1',
    foo: 'customProps-2',
};

Component.customProps.baz = 'customProps-3';

export default Component;
