class Some {
    static customProps = {
        bar: 'customProps-6',
        customProps: {
            bar: 'customDeepProp-1',
            baz: {
                foo: {
                    some: 'customDeepProp-2'
                },
                key: 'customDeepProp-3'
            }
        },
        foo: [1, 2, 4],
        baz: 'customProps-7',
        
    };
}

export default Some;
