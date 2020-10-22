import Some from "./Some";

type CustomProps = {
  [k: string]: string,
};

class AdditionalComponent {
  static customProps: CustomProps = {
    bar: "customProps-4",
    foo: "customProps-5",
  };
}

AdditionalComponent.customProps.baz = "customProps-6";

export default AdditionalComponent;
