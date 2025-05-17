export class LocationHashParameters {
  #params: { [key: string]: string };
  constructor() {
    const hash = window.location.hash.substring(1);
    this.#params = {};
    hash.split("&").map((hk) => {
      const temp = hk.split("=");
      this.#params[temp[0]] = temp[1];
    });
  }

  getKey(key: string) {
    return this.#params[key];
  }
}
