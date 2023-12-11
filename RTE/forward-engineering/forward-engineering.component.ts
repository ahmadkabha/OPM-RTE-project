import { ForwardEngineeringService } from './../forward-engineering.service';
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser'

@Component({
  selector: 'opcloud-forward-engineering',
  template: `
  <h1>&nbsp;&nbsp;&nbsp;Code Generation:</h1>
  <div class="tab">
  <button class='tablinks' *ngFor="let item of objects;let i= index" (click)="this.processCode(i)">{{names[i]}}</button>
  <button id='downloadButton' class='dd' (click)="downloadAll()">Download All</button>
  <button id='downloadButton' class='dd' (click)="downloadClass(dd)">Download Current</button>
  
  </div>
  <div id='myDiv' [innerHTML]="data">
  </div>
  
  `,
  styleUrls: ['./forward-engineering.component.scss']
})
export class ForwardEngineeringComponent implements OnInit {
  service: ForwardEngineeringService;
  objects: string[];
  data: string;
  indenting: number[];
  names: string[];
  dd: number;

  constructor(@Inject(DOCUMENT) document) {
    this.service = new ForwardEngineeringService
    this.objects = this.service.getObjects();
    this.names = this.service.getNames();
  }

  ngOnInit(): void {
    this.processCode(-1)
  }

  processCode(k: number) {
    let lines = []
    this.data = ''
    lines = lines.concat(this.objects[k].split('\n'))
    this.indenting = new Array(lines.length).fill(0)
    this.data += '<ol class="list">'
    if (k > -1) {
      for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim()
      }
      lines = this.filter2(lines)
      for (let i = 0; i < lines.length; i++) {
        this.fix_indenting(lines[i], i)
        lines[i] = this.indent(lines[i], this.indenting[i])
        if (i % 2 == 0) this.data += '<li class="linenum"><span class="evenLine">' + this.process_line(lines[i]) + '</span></li>\n'
        else this.data += '<li class="linenum"><span class="oddLine">' + this.process_line(lines[i]) + '</span></li>\n'
      }
    }
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
      if (i != k) tablinks[i].className = tablinks[i].className.replace(" active", "");
      else tablinks[i].className = "tablinks active";
    }
    this.dd = k;
  }

  process_line(str: string) {
    let staticCmds = ['export', 'extends', 'return', 'throw', 'if', 'else', 'switch', 'break', 'import', 'from']
    let types = ['number', 'any', 'string']
    let Bigtypes = ['class', 'enum', 'constructor', 'this', 'protected', 'public', 'private', 'Static', 'new', 'let', 'super', 'Error', 'null', 'case', 'static', 'default']
    let strings = ['["]{1}(?!bigtype)(?!>).+["]{1}']
    let names = this.service.getNames().concat(this.service.getEnums());
    names.push('Object');
    names.push('Partial');
    let funcs = this.service.getFuncs();
    funcs.push('assign')
    funcs.push('get')
    funcs.push('set')
    let en = this.service.getEnums()
    let x = []
    en.forEach(element => {
      x.push(element.replace(element.charAt(0), element.charAt(0).toUpperCase()));
    })
    let vars = this.service.getVars();
    vars.push('init')
    names.sort((a, b) => (a.length < b.length) ? 1 : -1)
    funcs.sort((a, b) => (a.length < b.length) ? 1 : -1)
    vars.sort((a, b) => (a.length < b.length) ? 1 : -1)
    for (let i = 0; i < funcs.length; i++) {
      funcs[i] = funcs[i].replace('_()', '')
    }
    for (let i = 0; i < vars.length; i++) {
      if (this.names.includes(vars[i])) {
        vars[i] = ''
      }
    }
    names = this.filter(names)
    vars = this.filter(vars)
    funcs = this.filter(funcs)
    str = this.change(str, Bigtypes, 'bigtype')
    str = this.change(str, strings, 'strng')
    str = this.change(str, staticCmds, 'cmd')
    str = this.change(str, types, 'type')
    str = this.change(str, vars, 'vars')
    str = this.change(str, names, 'nam')
    str = this.change(str, funcs, 'funcs')

    return str
  }

  fix_indenting(line: string, i: number) {
    let indent = line.match(/{/g)
    let revIndent = line.match(/}/g)
    if (indent != null) this.indenting.fill(this.indenting[i] + 1, i + 1)
    if (revIndent != null) {
      let z = this.indenting[i] - 1;
      if (this.indenting[i] == 0) z = 0
      this.indenting.fill(z, i);
    }
  }

  indent(str: string, num: number) {
    let res = ''
    for (let i = 0; i < num; i++) {
      res += '   '
    }
    return res + str
  }

  change(string, expressions, clas: string) {
    let len = expressions.length;
    for (let i = 0; i < len; i++) {
      let reg = new RegExp(`\\b(${expressions[i]})\\b`, 'g')
      let x = []
      string = string.replace(reg, '<span class="' + clas + '">' + expressions[i] + '</span>')
      if (clas == 'strng') {
        reg = new RegExp(`${expressions[i]}`, 'g')
        let b = string.match(reg)
        string = string.replace(reg, '<span class="' + clas + '">' + b + '</span>')
      }
    }
    return string
  }
  filter(arr) {
    let res = []
    for (let i = 0; i < arr.length; i++) {
      if (res.indexOf(arr[i]) == -1 && arr[i] != '') {
        res.push(arr[i])
      }
    }
    return res
  }
  filter2(arr) {
    let res = []
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == '' && i == 0) continue;
      if (arr[i] == '' && arr[i - 1] == '') continue;
      if (arr[i] == '' && i == arr.length - 1) continue;
      res.push(arr[i])
    }
    return res
  }
  downloadClass(i: number) {
    if (i + '' == 'undefined') return;
    var fileContents = this.objects[i];
    var filename = this.names[i] + '.ts';
    var filetype = "text/plain";

    var a = document.createElement("a");
    var dataURI = "data:" + filetype +
      ";base64," + btoa(fileContents);
    a.href = dataURI;
    a['download'] = filename;
    var e = document.createEvent("MouseEvents");
    // Use of deprecated function to satisfy TypeScript.
    e.initMouseEvent("click", true, false,
      document.defaultView, 0, 0, 0, 0, 0,
      false, false, false, false, 0, null);
    a.dispatchEvent(e);
  }
  downloadAll() {
    for (let i = 0; i < this.objects.length; i++) {
      this.downloadClass(i);
    }
  }
}