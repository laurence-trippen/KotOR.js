export class CExoLocSubString {

  language: number;
  gender: number;
  StringID: number;
  str: string;

  constructor(stringId = 0, str?: string) {
    this.language = Math.floor(stringId / 2);
    this.gender = stringId % 2;
    this.StringID = stringId;
    this.str = str; //1024 character limit
  }

  getLanguage() {
    return this.language;
  }

  getGender() {
    return this.gender;
  }

  GetStringID() {
    return (this.language * 2) + this.gender;
  }

  getString() {
    return this.str;
  }

  setLanguage(lang: number) {
    this.language = lang;
  }

  setGender(gender: number) {
    this.gender = gender;
  }

  setString(str: string) {
    this.str = str;
  }

  setStringID(StringID = 0){
    this.StringID = StringID;
    this.language = Math.floor(StringID / 2);
    this.gender = StringID % 2;
  }

}