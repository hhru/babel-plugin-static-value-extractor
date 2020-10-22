type CustomProps = {
  [k: string]: string;
};

class AdditionalComponent {
  static customProps: CustomProps = {
    bar: "AdditionalComponent-2",
    foo: "AdditionalComponent-4",
  };
}

export default AdditionalComponent;
