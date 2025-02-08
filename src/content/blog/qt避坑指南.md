---
title: "Qt随笔"
description: "我在Qt开发的一些感想与经验"
pubDate: "Feb 07 2025"
image: "/home.webp"
categories:

  - tech
tags:
  - C++
  - Qt
  - 信号和槽
  - moc
  - cmake
---

# cmake管理Qt项目
参考项目[reSnake](https://github.com/toucheres/reSnake)

在Qt6及以后，Qt便放弃qmake转向cmake。相比qmake,cmake能够更灵活且跨编译器，但cmake毕竟不是qt专属管理，部分细节需要更加谨慎。

addexecutable中添加的的.ui .qrc源文件不会自动调用moc，除非它们与cmakelists文件在同一文件夹下

例如

```
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)
……

add_executable(MY_PROJECT src/main.cpp form/main.ui form/main.qrc)
```

文件解释：

| 文件        | 含义                                                         |
| ----------- | ------------------------------------------------------------ |
| moc_*.cpp   | 当\*.cpp中含QOBJECT宏时,由moc编译器处理main.cpp中at相关的代码生成moc_\*.cpp |
| moc_*.cpp.d | 类似于moc_*.cpp的头文件                                      |
| ui_*.h      | (moc编译器处理*.ui所生成的.h头文件，包含了.ui的所有信息      |
| qrc_*.cpp   | 包含了*.qrc中所记录的文件的内容                              |



> [!NOTE]
>
> \*.qrc只是记录了资源文件的路径和别名等信息，没有包含真正的文件内容，而qrc_\*.cpp包含了qrc中所记录的文件内容，具体实现是将资源文件按字节存储到char[]中。

可以看到，main.ui并不是cmakelists同目录，因此即使使用了set(CMAKE_AUTOMOC ON),set(CMAKE_AUTOUIC ON),set(CMAKE_AUTORCC ON)也不会自动生成ui_main.h和qrc_main.cpp，但会自动生成moc_main.cpp和moc_main.cpp.d。

> [!NOTE]
>
> moc_main.cpp只包含main.cpp中qt相关的信息，所以最终阶段的编译是main.cpp,moc_main.cpp共同编译，其中main.cpp一般会include "ui_main.h"来确保ui的编译与载。

总结：

当设置set(CMAKE_AUTOMOC ON)，set(CMAKE_AUTOUIC ON)，set(CMAKE_AUTORCC ON)时

|                                      | 是否自动生成 | 是否自动包含 |
| ------------------------------------ | ------------ | ------------ |
| moc_main.cpp(与cmakelists同一目录下) | 是           | 是           |
| moc_mian.cpp(与cmakelists不同目录下) | 是           | 是           |
| ui_main.h(与cmakelists同一目录下)    | 是           | 是           |
| ui_main.h(与cmakelists不同目录下)    | 否           | 是           |
| qrc_main.cpp(与cmakelists同一目录下) | 否           | 是           |
| qrc_main.cpp(与cmakelists不同目录下) | 否           | 是           |

需要调用set(CMAKE_AUTOUIC_SEARCH_PATHS ${CMAKE_AUTOUIC_SEARCH_PATHS} ${FORMS_DIR})。

其中${FORMS_DIR}是.ui .qrc 的目录以便自动调用moc生成ui_xxx.ui和qrc_xxx.cpp文件。

# qt的多媒体

### 声音方面

QSoundEffect 主要用于播放短音效，通常只支持.wav 格式。
 QMediaPlayer 是一个更强大的类，支持更多的音频格式。

> [!WARNING]
>
> 如果QMediaPlayer播放音乐的音乐源来自qrc文件
>
> 则设置音乐路径格式为   
>
> QMediaPlayer *player = new QMediaPlayer;
>
>   QAudioOutput *audioOutput = new QAudioOutput;
>
>   player->setAudioOutput(audioOutput);
>
>   player->setSource(QUrl("qrc:/PATH")); //  **设置路径，其中PATH为文件对qrc文件的相对路径，前方的"qrc"不能省略**
>
>   audioOutput->setVolume(50);        // 设置音量
>
>   player->setLoops(QMediaPlayer::Infinite); // 设置循环播放
>
>   player->play();
>
>   qDebug() << "Music is playing";

### 图像方面

一般的做法是重写qwiget类的virtual void paintEvent(QPaintEvent* event);

paintEvent会在界面刷新时被调用，包括但不限于：

- 调用updata()
- 调用repaint()
- 聚焦于界面，如界面解除最小化

> [!NOTE]
>
> 使用update()函数
>
> *update()*函数实际上是调用了*repaint()*函数，但它不是同步的，可能不会立即执行。调用多次*update()*可能只执行一次*repaint()*函数。
>
> 直接调用*repaint()*函数
>
> 如果控件不是禁用状态或隐藏状态，它将直接调用*paintEvent()*函数。如果需要立即刷新，官方建议使用*repaint()*函数。

由于Qt的图像显示丰富，无法全部展开，这里仅仅以现有图片的显示为例

```
void reSnake::paintEvent(QPaintEvent* e)
{
    QPainter* painter = new QPainter(this);
    QPixmap* bkg_pixmap = new QPixmap(":/PATh");
    *bkg_pixmap = bkg_pixmap->scaled(this->width(), this->height(), Qt::IgnoreAspectRatio, Qt::SmoothTransformation);
    painter->drawPixmap(0, 0, *bkg_pixmap);
    painter->end();
}
```

> [!CAUTION]
>
> QPixmap中设置qrc文件中资源为图像资源时不能以qrc:开头。这恰恰与Qt的音频相反

# qt的ui相关

#### ui的载入时机

qt中对ui(中组件)的修改，访问必须在ui载入(即ui.setupUi(this);)后，即使ui为类的成员。

意味着在含ui的qt类构造函数中

```
reSnake::reSnake(QWidget *parent)
    : QMainWindow (parent)
{
    ui.btn1->click();// 此时ui未载入
    ui.setupUi(this);
}
```

是非法的,而

```
reSnake::reSnake(QWidget *parent)
    : QMainWindow (parent)
{
    ui.setupUi(this);
    ui.btn1->click();// ui已载入
}
```

是合法的

#### ui的跨线程修改

qt不支持普通函数的跨线程修改，需使用主窗口的线程安全函数（例如 QMetaObject::invokeMethod，实际上这个函数是qt在一定程度上通过反射实现的）来更新ui。或者在类中定义操作ui的槽函数，其他线程来调用槽函数。信号和槽是线程安全的。

# Qt的部分命名规则

#### 类的函数

以动词普通形式出现的函数一般是槽函数(一般用于触发对应的信号)，以过去分词(xxxed)形式出现的一般是信号。

例如：

```
QPushButton::click()是一个槽函数，发出clicked信号
QPushButton::clicked()是一个信号，可用于绑定或主动触发
```

关于信号的发出

实例：

MyWidget.h

```
#include <QWidget>

class MyWidget : public QWidget
{
    Q_OBJECT
public:
    explicit MyWidget(QWidget *parent = nullptr);

signals:
    void mySignal(int value); // 声明一个带 int 参数的信号，类似于QPushButton::clicked()

public slots:
    void mySlot(int value);   // 声明一个槽，用于接收信号
};
```

MyWidget.cpp

```
#include "MyWidget.h"
#include <QDebug>

MyWidget::MyWidget(QWidget *parent) : QWidget(parent)
{
    // 将信号连接到槽
    connect(this, &MyWidget::mySignal, this, &MyWidget::mySlot);
    
    // 例如在某处触发信号
    int num = 100;
    emit mySignal(num); // 触发 mySignal 信号，并传递参数
}

void MyWidget::mySlot(int value)
{
    qDebug() << "mySlot 被调用，接收到参数:" << value;
}
```

> [!NOTE]
>
> 在 Qt 中，emit 只是一个空宏，不会改变函数调用机制，使用 emit 关键字只是为了代码可读性。因此，调用 emit mySignal(num); 与直接调用mySignal(num);是等效的。但建议使用 emit，以表明这是信号的触发操作。

关于Q_EMIT，emit的定义

qtmetamacros.h中:

```
# define Q_EMIT
#ifndef QT_NO_EMIT
# define emit
#endif
```

可见emit,Q_EMIT均为空宏，仅仅作为标识，不影响语法。

另外emit在其他项目中过于频繁，推荐全部替换为Q_EMIT，此时不会引入emit宏，防止命名冲突。

# 关于信号和槽连接的生命周期

由于connect的信号和槽有参数要求，所以我们经常使用lambda来代替原始槽，如

```
	connect(ui.tarin, &QPushButton::clicked, this, [=]()
		{
			// 一些函数……
			ui.select->show();
			ui.inputready->show();
		});
```

但由于lambda不属于任何一个对象，所以有时会”省略“第三个参数(即槽的所有者)使用其重载版本

```
	connect(ui.tarin, &QPushButton::clicked, [=]()
		{
			// 一些函数……
			ui.select->show();
			ui.inputready->show();
		});
```

这其实等价于将槽的所有者设为信号的所有者，即

```
	connect(ui.tarin, &QPushButton::clicked, ui.tarin, [=]()
		{
			// 一些函数……
			this.ui.select->show();
			this.ui.inputready->show();
		});
```

**但这是不安全的，(四参数版本的，或者说第五个参数被省略的“四参数”版本)的connect的一三参数分别管理该连接的生命周期。当两者的任意一个销毁被感知时（Qt对象可被感知），连接将失效，以确保不会调用非法的(已析构的)对象的成员函数**

一般而言，四参数版本的connect的一三参数均为Qt类(指针)，二四参数为对应的信号或槽，以便生命周期管理。

当第四参数为lambda(比如第一个示例)时会触发另一个重载，第三个参数(通常是Qt类，如this指针)会被解释为上下文(context)。由上下文管理其生命周期，即使lambda不是其槽函数.

回看第三个例子，lambda中明显使用了this中的成员，其生命周期应小于等于this指针的生命周期，因此将this作为上下文传递，确保this析构后不会在使用该连接。

# Qt与模版

Qt要求Qt类的声明于实现分离,分文件。这与模板天然冲突。所以尽量不要在Qt中使用模板，或在模板中使用Qt



