/********************************************************************************
** Form generated from reading UI file 'ShaderWidget.ui'
**
** Created by: Qt User Interface Compiler version 5.14.1
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_SHADERWIDGET_H
#define UI_SHADERWIDGET_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_ShaderWidgetClass
{
public:

    void setupUi(QWidget *ShaderWidgetClass)
    {
        if (ShaderWidgetClass->objectName().isEmpty())
            ShaderWidgetClass->setObjectName(QString::fromUtf8("ShaderWidgetClass"));
        ShaderWidgetClass->resize(600, 400);

        retranslateUi(ShaderWidgetClass);

        QMetaObject::connectSlotsByName(ShaderWidgetClass);
    } // setupUi

    void retranslateUi(QWidget *ShaderWidgetClass)
    {
        ShaderWidgetClass->setWindowTitle(QCoreApplication::translate("ShaderWidgetClass", "ShaderWidget", nullptr));
    } // retranslateUi

};

namespace Ui {
    class ShaderWidgetClass: public Ui_ShaderWidgetClass {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_SHADERWIDGET_H
