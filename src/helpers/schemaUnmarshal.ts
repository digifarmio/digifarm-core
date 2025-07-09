const schemaPrefixes = [
  {
    keyPattern: /^KEYID#([^#;]+)#APITYPE#([^#;]+)$/g,
    transform: (attribute: string, keyPattern: string) => {
      const [, keyId, apiType] = attribute.split(keyPattern);

      return {
        keyId,
        apiType,
      };
    },
  },
  {
    keyPattern: /^DATE#([^#;]+)$/g,
    id: "date",
  },
  {
    keyPattern: /^ORG#([^#;]+)$/g,
    id: "organizationId",
  },
  {
    keyPattern: /^USERID#([^#;]+)$/g,
    id: "userId",
  },
  {
    keyPattern: /^TOKENID#([^#;]+)$/g,
    id: "userId",
  },
];

export const schemaUnMarshal = (item: any) => {
  if (!item) {
    return item;
  }

  const { PK, SK, ...params } = item;

  const [PKPattern] = schemaPrefixes.filter(
    (pattern) => PK && PK.match(pattern.keyPattern)
  );

  const [SKPattern] = schemaPrefixes.filter(
    (pattern) => SK && SK.match(pattern.keyPattern)
  );

  const setUnmarshelledParams = Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value?.wrapperName === "Set") {
        acc[key] = value.values;
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );

  if (PKPattern) {
    if (PKPattern.id) {
      setUnmarshelledParams[PKPattern.id] = PK.split(PKPattern.keyPattern)[1];
    } else if (PKPattern.transform) {
      const matchedObject = PKPattern.transform(PK, PKPattern.keyPattern);
      Object.assign(setUnmarshelledParams, matchedObject);
    }
  }

  if (SKPattern?.id) {
    setUnmarshelledParams[SKPattern.id] = SK.split(SKPattern.keyPattern)[1];
  }

  return setUnmarshelledParams;
};
