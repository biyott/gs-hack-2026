declare module "js-aruco2" {
  namespace AR {
    class Detector {
      constructor(options: { dictionaryName: "ARUCO_MIP_36h12"; maxHammingDistance: number });
      detect(image: { width: number; height: number; data: Uint8Array }): unknown;
      notTooNear(candidates: unknown, minDistance: number): unknown;
    }
    class Dictionary {
      constructor(name: "ARUCO_MIP_36h12");
      generateSVG(id: number): string;
    }
  }
  const aruco: { readonly AR: typeof AR };
  export default aruco;
}
