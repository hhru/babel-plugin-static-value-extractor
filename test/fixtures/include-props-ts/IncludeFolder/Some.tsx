type CustomProps = {
  [k: string]: string,
};

class Some {
  static customProps: CustomProps = {
    bar: "customProps-7",
    foo: "customProps-8",
    baz: "customProps-9",
  };
}

export default Some;
