#pragma once
#include <QKeyEvent>
#include <QtWidgets/QWidget>
#include <qimage.h>
#include<QTimer>
#include <qopengl.h>
#include <qopenglwidget.h>
#include <algorithm>
#include <qopenglshaderprogram.h>
#include <qgl.h>
#include <qopenglfunctions_4_3_core.h>

class ShaderWidget : public QOpenGLWidget {
private:
	QOpenGLShaderProgram program;//для компиляции шейдера, активация шейдорной программы
	GLfloat* vert_data;//массив вершин 
	int position;//хранится расположение этого массива в пределах списка параметров шейдерной программы
	QOpenGLFunctions_4_3_Core* functions;
	GLuint ssbo = 0;
	int x, y, z; //источник света
	int k = 0;
	int i = 0;
	struct Sphere {
		QVector3D pos;
		float radius;
		QVector3D color;
		int material_ind;
	};
	struct Camera {
		QVector3D pos;
		QVector3D view;
		QVector3D up;
		QVector3D side;
	};
	Camera camera;
	/*struct Triangle {
		QVector3D v1;
		QVector3D v2;
		QVector3D v3;
		QVector3D color;
		int material_ind;
	};*/

protected:
	void initializeGL() override;
	void resizeGL(int _width, int _height) override;
	void paintGL() override;
public:
	ShaderWidget(QWidget* parent = 0);
	~ShaderWidget();
public slots:
	void keyPressEvent(QKeyEvent* event) override;
};


