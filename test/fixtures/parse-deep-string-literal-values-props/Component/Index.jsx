import AdditionalComponent from './AdditionalComponent';

const component = () => {};

Component.customProps = {
    bar: 'customProps-1',
    foo: 'customProps-2',
    baz: () => {},
};

Component.customProps.baz = 'customProps-3';

export default Component;
