#!/bin/sh
GLM=three node native-tests/ex-$1.js > ./tmp/ex-$1.js.txt
./tmp/test-ex-$1 > ./tmp/ex-$1.cpp.txt
icdiff --whole-file ./tmp/ex-$1.js.txt  ./tmp/ex-$1.cpp.txt 

