import Some from './Some';

class AdditionalComponent {
    static customProps = {
        bar: 'customProps-4',
        foo: 'customProps-5',
    };
}

AdditionalComponent.customProps.baz = 'customProps-6'

export default AdditionalComponent;
