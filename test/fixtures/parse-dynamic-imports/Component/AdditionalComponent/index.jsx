class AdditionalComponent {
    static customProps = {
        bar: 'customProps-3',
        foo: 'customProps-4',
    };
    
    method() {
        import('./Some');
    }
}

export default AdditionalComponent;
