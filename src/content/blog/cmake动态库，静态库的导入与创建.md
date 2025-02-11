---
title: "Cmake构建、使用动态、静态库"
description: "在cmake中导入，连接库，并尝试做一个模块库"
pubDate: "Feb 12 2025"
image: "/home.webp"
categories:

  - tech
tags:
  - 动态库
  - 静态库
  - 制作库
  - cmake
---
我的博客[toucher](https://toucheres.github.io/)

# cmake中的动态库，静态库的导入与创建

示例仓库[toucheres/lib_dll_test](https://github.com/toucheres/lib_dll_test)
我们以windows下的动态库dll,静态库lib为例。cmake跨平台，所以同样适用于linux

# 库的导入

# 对于包含了.cmake文件的库

包含了cmake_install.cmake的库意味着无需手动导入库的头文件（当使用cmake进行项目管理时），方便快捷。常见于大型、专业的库，如Qt。

## 动态库的导入

假设dlltest为我们自定义的动态库或第三方库，且它不处于环境变量或其他特殊路径下。
exetest为自定义可执行程序，且它不处于环境变量或其他特殊路径下。
以下为exetest的CmakeLists.txt文件的部分内容，目的是在exetest项目中正确引入dlltest动态库

### 1.找到库

find_package(dlltest REQUIRED PATHS yourDllLibPath NO_DEFAULT_PATH)
其中

dlltest 为你的动态库名称，

REQUIRED关键字代表如果未找到该库，请报错。

paths关键字用于指定库路径，如果库处于默认路径下(如默认安装的qt库)且无版本要求，该关键字可省略，

> [!NOTE]
>
> 注意，cmake关键字不区分大小写，但变量严格区分大小写

### 2.链接库

target_link_libraries(exetest PRIVATE dlltest::dlltest Qt6::Widgets Qt6::Concurrent) 
为exetest项目私有地(关键字PRIVATE)链接dlltest中的dlltest模块或命名空间和qt6库中的widgets,concurrent模块或命令空间。

> [!NOTE]
>
> 如果库中未区分模块或命名空间，双冒号以及后续模块/命名空间应省略

#### 关于链接权限

包含PRIVATE、PUBLIC与INTERFACE三种，它决定了库在何时被链接到目标上。简单来说，链接权限就是一个规则，告诉CMake如何处理库和目标之间的关系。

假设a链接了b，而b又链接了c。

a<--b<--c

如果b链接c的时设定的权限分别为

|           | b是否可见（可调用）c | a是否可见（可调用）c |      |
| --------- | -------------------- | -------------------- | ---- |
| PRIVATE   | 是                   | 否                   |      |
| PUBLIC    | 是                   | 是                   |      |
| INTERFACE | 否                   | 是                   |      |

关于interface的意义

有些目标是没有实质内容的，比如header-only的库。他们没办法编译成静态/动态库。因为它们是没有源码的，只有头文件。一旦编译，就会报错。他们的唯一作用，就是被别人引用，此时可以用interface来进行传递。

更多细节参考[彻底弄懂cmake中的 INTEFACE 可见性/传递性 问题 | Chunlei Li](https://chunleili.github.io/cmake/understanding-INTERFACE)

#### 关于target_link_libraries和link_libraries

其实不仅是link_libraries，其他cmake命令也有target之分，如

target_link_directories和link_directories

两者的区别是target_……是作用于特定项目，而不含target的版本是作用于其后的所有项目

也因此，target_……需要获取特定项目的名称，所以一般在add_executable，add_library之后

而不含target的版本作用于全局，无需获取特定项目名，一般在add_executable，add_library之前

一般而言，不含target的版本用于顶级cmakelists用于管理所有文件，而target版本用于子项目来精细化管理

> [!NOTE]
>
> 顶层cmakelists对底层cmakelists可见，即底层cmake可调用顶层cmake的变量等。而底层cmake对顶层cmake不可见，顶层cmake不可调用底层cmake的变量。



#### 3.一些可选的设置

对于自定义或未安装在环境中的第三方库，最终产生的exe找不到dlltest.dll文件(假设dll 不在环境变量中)，我们需要将dll文件复制到exe文件所属目录下，但该过程其实可以在cmakelists中部署以自动实现
例如cmake的file复制命令file(COPY <源文件路径> DESTINATION <目标目录>)或copyif命令
示例：

```cmake
add_custom_command(TARGET exetest POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "$<TARGET_FILE:dlltest>"
    $<TARGET_FILE_DIR:exetest>
)
```



更详细的讲解【CMake(5)-add_custom_command自定义命令拷贝文件-哔哩哔哩】 https://b23.tv/MXhCpUL

## 静态库的导入

基本与动态库相同，但无需将.dll或.lib复制到exe目录下，.lib的中信息（如函数、类等）已经在链接阶段整合进入exe中。

但编译时.dll，.lib文件缺一不可

## 一个简单的示例

```cmake
# exetest/CMakeLists.txt

cmake_minimum_required(VERSION 3.8)
project(exetest LANGUAGES CXX)

# 添加可执行目标
add_executable(exetest main.cpp)

# 查找 libtest 包
find_package(libtest REQUIRED PATHS "C:/Users/asus/source/repos/libtest/out/build/x64-debug/libtest" NO_DEFAULT_PATH)

# 查找 dlltest 包
find_package(dlltest REQUIRED PATHS "C:/Users/asus/source/repos/libtest/out/build/x64-debug/dlltest" NO_DEFAULT_PATH)

# 链接库
target_link_libraries(exetest PRIVATE libtest::libtest dlltest::dlltest)

# 设置 C++ 标准
set_target_properties(exetest PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
)

# 自定义命令：复制 DLL 文件到可执行文件目录
add_custom_command(TARGET exetest POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "$<TARGET_FILE:dlltest>"
    $<TARGET_FILE_DIR:exetest>
)
```

# 对于未包含.cmake文件的库

未包含cmake_install.cmake的库意味着需手动导入库的头文件。常见于小型、非专业的库。

## 动态库的导入

不仅需要导入dll文件，还要导入头文件。

导入dll的步骤与先前相同，但我们还需导入头文件

### 导入头文件目录

target_include_directories或include_directories，两者差别同上。

> [!CAUTION]
>
> target_include_directories/include_directories导入的是头文件路径而不是头文件本身

## 静态库的导入

与动态库基本一致

# 库的创建

## 含有.cmake文件的库的创建

我们以一个小型案例讲解，仓库连接：[toucheres/lib_dll_test](https://github.com/toucheres/lib_dll_test)

## 项目结构

```
C:.
│  CMakeLists.txt
│
├─build
│  ├─dlltest
│  │
│  ├─exetest
│  │
│  ├─libtest
│
├─dlltest
│  │  CMakeLists.txt
│  │  dlltestConfig.cmake.in
│  │  dynamic_lib.cpp
│  │
│  └─include
│          dynamic_lib.h
│
├─exetest
│  │  CMakeLists.txt
│  │  main.cpp
│  │
│  └─include
│          main.h
│
└─libtest
    │  CMakeLists.txt
    │  libtestConfig.cmake.in
    │  static_lib.cpp
    │
    └─include
            static_lib.h
```



其中build目录为cmake构建目录，即在此目录下执行cmake ..

顶层CMakeLists中：

```cmake
cmake_minimum_required (VERSION 3.8)
project ("MyProject")
# 包含子项目。
add_subdirectory ("libtest")
add_subdirectory ("dlltest")
add_subdirectory ("exetest")
add_dependencies(exetest libtest dlltest)
```

添加三个子项目，分别是静态库libtest，动态库dlltest，可执行程序exetest。

因此该cmakelists文件必须有三个与之同名并包含cmakelists的文件夹作为子项目的目录 。

因为exetest中的库文件是libtest，dlltest。因此为保证exetest在libtest,dlltest后编译，我们在最后为exetest添加依赖dlltest和litest。即add_dependencies(exetest libtest dlltest)。

对于动态库dlltest，cmakelist文件为

```cmake
# dlltest/CMakeLists.txt
# DESTINATION 指定了文件安装的相对路径。这个路径是相对于 CMAKE_INSTALL_PREFIX 的
# CMAKE_INSTALL_PREFIX默认为C:/Program Files/顶级项目名，但一般而言为CMAKE_CURRENT_BINARY_DIR，即构建目录

cmake_minimum_required(VERSION 3.8)

project(dlltest VERSION 1.0.0 LANGUAGES CXX)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 添加动态库目标
add_library(dlltest SHARED "dynamic_lib.cpp")

# 定义包含目录，使用 PUBLIC 关键字
target_include_directories(dlltest
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# 安装目标
install(TARGETS dlltest
  EXPORT dlltestTargets
  LIBRARY DESTINATION lib #.so文件，linux下有效
  ARCHIVE DESTINATION lib #.lib文件
  RUNTIME DESTINATION bin #.dll文件
  INCLUDES DESTINATION include #.h文件
)

# 安装头文件
install(DIRECTORY include/ DESTINATION include)

# 导出目标以供其他项目使用
install(EXPORT dlltestTargets
  FILE dlltestTargets.cmake
  NAMESPACE dlltest::
  DESTINATION lib/cmake/dlltest
)

# 生成并安装配置文件
include(CMakePackageConfigHelpers)

# 写入版本文件
write_basic_package_version_file(
  "${CMAKE_CURRENT_BINARY_DIR}/dlltestConfigVersion.cmake"
  VERSION ${PROJECT_VERSION}
  COMPATIBILITY AnyNewerVersion
)

# 配置配置文件
configure_package_config_file(
  "${CMAKE_CURRENT_SOURCE_DIR}/dlltestConfig.cmake.in"
  "${CMAKE_CURRENT_BINARY_DIR}/dlltestConfig.cmake"
  INSTALL_DESTINATION lib/cmake/dlltest
)

# 安装配置文件
install(FILES
  "${CMAKE_CURRENT_BINARY_DIR}/dlltestConfig.cmake"
  "${CMAKE_CURRENT_BINARY_DIR}/dlltestConfigVersion.cmake"
  DESTINATION lib/cmake/dlltest
)

# 在构建树中导出目标
export(EXPORT dlltestTargets
  FILE "${CMAKE_CURRENT_BINARY_DIR}/dlltestTargets.cmake"
  NAMESPACE dlltest::
)

```

与cmakelists同级的dlltestConfig.cmake.in中

```cmake
   @PACKAGE_INIT@
   include("${CMAKE_CURRENT_LIST_DIR}/dlltestTargets.cmake")
```

```
CMAKE_CURRENT_SOURCE_DIR 
含义:  
当前正在处理的 CMakeLists.txt所在的源代码目录的完整路径,跟随 CMake 处理不同目录下的 CMakeLists.txt而变化 
默认值: <project-source-root>/<relative-path-to-current-CMakeLists>

CMAKE_CURRENT_BINARY_DIR
含义:
当前正在处理CMakeLists.txt对应的构建目录的完整路径用于存放编译产物和生成的文件 
默认值:
<build-root>/<relative-path-to-current-CMakeLists>
```

> [!WARNING]
>
> 安装头文件时 install(DIRECTORY include/ DESTINATION include) 是指将DIRECTORY **include下的所有文件**install到DESTINATION include
> 而install(DIRECTORY include DESTINATION include)是指将DIRECTORY **include文件夹本身**install到DESTINATION include

同样的在libtest/CMakeLists中

```cmake
# CMakeLists.txt: libtest 的 CMake 项目文件

cmake_minimum_required(VERSION 3.8)

project(libtest VERSION 1.0.0 LANGUAGES CXX)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 添加静态库目标
add_library(libtest STATIC "static_lib.cpp" "include/static_lib.h")

# 定义包含目录
target_include_directories(libtest
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# 设置编译属性（可选）
if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET libtest PROPERTY CXX_STANDARD 20)
endif()

# 安装目标
install(TARGETS libtest
  EXPORT libtestTargets
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
  INCLUDES DESTINATION include
)

# 安装头文件
install(DIRECTORY include/ DESTINATION include)

# 导出目标以供其他项目使用
install(EXPORT libtestTargets
  FILE libtestTargets.cmake
  NAMESPACE libtest::
  DESTINATION lib/cmake/libtest
)

# 生成并安装配置文件
include(CMakePackageConfigHelpers)

# 写入版本文件
write_basic_package_version_file(
  "${CMAKE_CURRENT_BINARY_DIR}/libtestConfigVersion.cmake"
  VERSION ${PROJECT_VERSION}
  COMPATIBILITY AnyNewerVersion
)

# 配置包配置文件
configure_package_config_file(
  "${CMAKE_CURRENT_SOURCE_DIR}/libtestConfig.cmake.in"
  "${CMAKE_CURRENT_BINARY_DIR}/libtestConfig.cmake"
  INSTALL_DESTINATION lib/cmake/libtest
)

# 安装配置文件
install(FILES
  "${CMAKE_CURRENT_BINARY_DIR}/libtestConfig.cmake"
  "${CMAKE_CURRENT_BINARY_DIR}/libtestConfigVersion.cmake"
  DESTINATION lib/cmake/libtest
)

# 这确保在构建过程中，构建目录中有 libtestTargets.cmake 文件
export(EXPORT libtestTargets
  FILE "${CMAKE_CURRENT_BINARY_DIR}/libtestTargets.cmake"
  NAMESPACE libtest::
)

```

libtest/libtestConfig.cmake.in中

```cmake
@PACKAGE_INIT@
include("${CMAKE_CURRENT_LIST_DIR}/libtestTargets.cmake")
```

在exetest/CMakeLists中运用开头所示导入含.cmake文件库的方法

```cmake
# exetest/CMakeLists.txt

cmake_minimum_required(VERSION 3.8)
project(exetest LANGUAGES CXX)

# 添加可执行目标
add_executable(exetest main.cpp)

# 查找 libtest 包
find_package(libtest REQUIRED PATHS "${CMAKE_CURRENT_SOURCE_DIR}/build/libtest" NO_DEFAULT_PATH)

# 查找 dlltest 包
find_package(dlltest REQUIRED PATHS "${CMAKE_CURRENT_SOURCE_DIR}/build/dlltest" NO_DEFAULT_PATH)

# 链接库
target_link_libraries(exetest PRIVATE libtest::libtest dlltest::dlltest)

# 设置 C++ 标准
set_target_properties(exetest PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
)

# 自定义命令：复制 DLL 文件到可执行文件目录
add_custom_command(TARGET exetest POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    "$<TARGET_FILE:dlltest>"
    $<TARGET_FILE_DIR:exetest>
)

```

对于main.cpp，dynamic_lib.cpp和static_lib.cpp的内容则可以自定义，但动态库的代码不是跨平台的。这里在windows下做个小例子。

dlltest/include/dynamic_lib.h

```cmake
#pragma once
#define  DLL_API _declspec(dllexport)
DLL_API int add_dll(int x, int y);
```

dlltest/dynamic_lib.cpp

```cmake
#include "dynamic_lib.h"
#define  DLL_API _declspec(dllexport)
DLL_API int add_dll(int a, int b)   //实现两个整数相加
{
	return a + b;
}
```

libtest/include/static_lib.h

```cmake
#pragma once
#include <iostream>
int add_lib(int x, int y);
```

libtest/static_lib.cpp

```cmake
#include "static_lib.h"
int add_lib(int x, int y)
{
	return x + y;
}
```

exetest/main.cpp

```cmake
#include <iostream>
#include <dynamic_lib.h>
#include <static_lib.h>
int main()
{
    std::cout<<"add_from_dll:\n";
    std::cout << "1+1=" << add_dll(1, 1) << '\n';
    std::cout << "add_from_lib:\n";
    std::cout << "1+1=" << add_lib(1, 1) << '\n';
    return 0;
}
```

输出:

```
add_from_dll:
1+1=2
add_from_lib:
1+1=2
```

### 关于include(CMakePackageConfigHelpers)

其实大部分cmake导出工作是通过一组用于创建配置文件的辅助函数CMakePackageConfigHelpers实现的，实际底层远比这复杂，这里只是简单的创建一个示例，目的是更清楚如何使用第三方库。或者当必须创建库时，懂得如何*~~复制粘贴~~*借鉴他人的cmake。

## 不含.cmake文件的库的创建

其实与创建exe程序差不多，只是将add_executable替换为add_library，然后将头文件和库打包成压缩包就可以发给别人用啦！

例如

```cmake
cmake_minimum_required(VERSION 3.8)

project(dlltest VERSION 1.0.0 LANGUAGES CXX)

# 设置 C++ 标准
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 添加动态库目标
add_library(dlltest SHARED "dynamic_lib.cpp")

# 定义包含目录，使用 PUBLIC 关键字
target_include_directories(dlltest
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
```

没错，就是前半部分的含.cmake库的cmakelists

并且因为无需导出.cmake，.cmake.in文件也无需添加

## 使用方式

当直接运行该项目时会报错找不到dlltest,libtest库，是因为我们在exetest中用到了这些库但此时还未生成。因此，我们需要先排除exetest，生成两个库后再加入exetest。即先修改顶层cmake为

```cmake
cmake_minimum_required (VERSION 3.8)
project ("MyProject")
# 包含子项目。
add_subdirectory ("libtest")
add_subdirectory ("dlltest")
# add_subdirectory ("exetest")
# add_dependencies(exetest libtest dlltest)
```

配置cmake并生成所有项目。

然后加入exetest，即

```cmake
cmake_minimum_required (VERSION 3.8)
project ("MyProject")
# 包含子项目。
add_subdirectory ("libtest")
add_subdirectory ("dlltest")
add_subdirectory ("exetest")
add_dependencies(exetest libtest dlltest)
```

再配置、生成、运行。

注意生成库文件后不要清理，不然还是可能找不到库

## 两种构建库方式的优劣

很明显第二种(即不含,cmake文件)要简单，个人建议初学者还是将精力放在源代码的质量上，而不是纠结这些“无关紧要”的细致末节。

但如果想真正做一款商用级的库，cmake模块管理的优势明显。毕竟cmake已经成为了c++开源项目的事实标准。

