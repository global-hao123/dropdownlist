# jQuery dropdownlist plugin

A jQuery plugin for custom select

>针对目前页面上有很多相同自定义样式的下拉列表散布在多个模块中（因为样式需要自定义，故不能使用原始的select标签，需要用其它标签来模拟一个select），将初始化及此部分的通用事件绑定代码提出来作为一个单独的组件，提供初始化、通用事件（包括下拉列表的显隐、列表项的选择等）、一套通用样式

## Demo

http://global-hao123.github.io/dropdownlist/

## How to use

在页面上添加一个隐藏的select元素，参数至少需要提供一个id，

- 如果select里面是空白则下拉内容通过js赋值给data参数来生成（适用于动态内容）,如

```html
   <select id="#{selector}"></select>
```

- 如果在select内写option则下拉内容直接从页面的option里取（适用于固定内容，option的值和显示名称一样则可以省略value属性），如

```html
   <select id="selector">
      <option value="#{id}">#{name}</option>
      ...
   </select>
```

 生成的自定义下拉列表宽度取决于占位selector的宽度，默认比其宽度少30px

 实例化语句如下：

```javascript
 var typelist = new Dropdownlist(opt);
```

## Options

| Option        | Type | Default Value        | Description |
| ------------- |:-----|:--------:| -----:|
| selector     | `string` | 必填 | 占位元素的id |
| data     | `array` | [],选填 | 指定下拉列表的数据 |
| defIndex     | `number` | 0,默认取列表中的第一项,特殊需要留白但是不占用下拉项时可以设置为-1,选填 | 默认选中项的index |
| allowEmpty     | `number` | 0,选填 | 是否允许有空白项 |
| emptyItem     | `object` | {id:"", name:""},选填 | 空白项数据 |
| visibleNum     | `number` | 5,选填 | 最多可见的行数,多于此数就显示滚动条 |
| lineHeight     | `string` | 24,选填 | 列表项高度 |
| child     | `Dropdownlist` | 选填 | 级联dropdownlist对象,初始化顺序需要排在级联对象之后,如果有child则supportSumbit自动为1 |
| supportSubmit     | `number` | 0,选填 | 是否支持提交或级联操作 |
| onChange     | `function` | 选填 | select的onChange回调 |
| appendToBody     | `number` | 0,选填 | 下拉列表是否要插到body下，避免被祖先元素的任何样式限制（比如说z-index和overflow:hidden都可能导致下拉列表被挡住） |
| customScrollbar     |`number` | false,选填 | 是否使用自定义滚动条 |
| customLiTpl     |`string` | ```html<li value='#{id}' title='#{name}'>#{name}</li>```,选填 | 自定义li的tpl |

## 对外可见的属性和方法：

| Key        | Type | Description |
| ------------- |:--------:| -----:|
| value     | `string` | 返回当前选中的值 |
| title     | `string` | 返回当前选中的名称 |
| reset(data,defIndex)     | `function` | 重置下拉列表内容 |

## DEMO

#### 1.内容固定，可以直接写在option中

【注1】如果option没有指定value，则默认取option的文案作为value
【注2】文案长度过长时会自动把超出部分用...显示

```html
<select id="select1">
    <option value="1" title="extremely long text extremely long text extremely long text">extremely long text extremely long text extremely long text</option>
    <option value="2" title="bbb">bbb</option>
</select>
```

```javascript
new Dropdownlist({
    selector: "select1"
});
```

#### 2.内容灵活作为参数传入

```html
<select id="select1"></select>
```

```javascript
var data = [{
    id: "1",
    name: "aaaa"
},{
    id: "2",
    name: "bbbb"
}];
new Dropdownlist({
    selector: "select1",
    data: data
});
```

#### 3.设置默认值

```javascript
new Dropdownlist({
    selector: "select1",
    data: data,
    defIndex: 1
});
```

#### 4.内容太长可以使用滚动条

```javascript
new Dropdownlist({
    selector: "select3",
    visibleNum: 5, // 5 lines at most
    lineHeight: 24 // each line 24px high
});
```

#### 5.级联

```html
<label for="select1">级联a：</label>
<select id="select1"></select>
<br/><br/>
<label for="select2">级联b：</label>
<select id="select2"></select>
<br/><br/>
<label for="select3">级联c：</label>
<select id="select3"></select>
```

```javascript
// test data, each dimention needs to be structured strictly as array containing object - {id:"xxx",name:"xxx"}
var rawData = [{
    id: "0",
    name: "0",
    brand: [{
        id: "0",
        name: "0-0",
        model:[{
            id: "0",
            name: "0-0-0"
        },{
            id: "1",
            name: "0-0-1"
        }]
    },{
        id: "1",
        name: "0-1",
        model:[{
            id: "0",
            name: "0-1-0"
        },{
            id: "1",
            name: "0-1-1"
        }]
    }]
},{
    id: "1",
    name: "1",
    brand: [{
        id: "0",
        name: "1-0",
        model:[{
            id: "0",
            name: "1-0-0"
        },{
            id: "1",
            name: "1-0-1"
        }]
    },{
        id: "1",
        name: "1-1",
        model:[{
            id: "0",
            name: "1-1-0"
        },{
            id: "1",
            name: "1-1-1"
        }]
    }]
}];
function getData(data,param,prop){
    var result = data;
    result = result[param] && result[param][prop] ? result[param][prop] : [];
    return result;
}
var dropdown3 = new Dropdownlist({
    selector: "select3",
    allowEmpty: "1",
    emptyItem: {
        id: "",
        name: "ALL"
    }
});
var dropdown2 = new Dropdownlist({
    selector: "select2",
    child: dropdown3,
    allowEmpty: "1",
    emptyItem: {
        id: "",
        name: "ALL"
    },
    onChange: function(){
        var that = this;
        that.child.reset(getData(that.data,that.selIndex,"model"));
    }
});
var dropdown1 = new Dropdownlist({
    selector: "select1",
    child: dropdown2,
    data: rawData,
    emptyItem: {
        id: "",
        name: "ALL"
    },
    onChange: function(){
        var that = this;
        that.child.reset(getData(that.data,that.selIndex,"brand"));
    }
});
```

## Contributing

## Release History

* 2014/01/03 - v1.1.1 - Add cascade and allowEmpty options
* 2013/11/14 - v1.1.0 - Optimization
* 2013/09/17 - v1.0.1 - Fix a event binding bug
* 2013/09/13 - v1.0.0 - First release

## Authors

* [wangmingfei](http://gitlab.pro/u/wangmingfei)
