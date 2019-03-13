import { After } from './before';

const component = () => {};

Component.customProps = {
    bar: 'customProps-1',
    foo: 'customProps-2',
    baz: () => {},
};

export default Component;
