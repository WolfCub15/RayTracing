#include "ShaderWidget.h"

void ShaderWidget::initializeGL() {
	glClearColor(1.0f, 1.0f, 1.0f, 1.0f);

	QOpenGLShader vert_shader(QOpenGLShader::Vertex);
	vert_shader.compileSourceFile("sh.vert");
	QOpenGLShader frag_shader(QOpenGLShader::Fragment);
	frag_shader.compileSourceFile("s.frag");
	//добавляем скомпилированные шейдеры в шейдерную программу
	program.addShader(&vert_shader);
	program.addShader(&frag_shader);

	if (!program.link()) {
		qWarning("\n error link programm shader\n");
		return;
	}
	//получаем расположение массива вершин в пределах списка параметров шейдерной программы
	position = program.attributeLocation("vertex");

	//активировать шейдерную программу
	if (!program.bind()) {
		qWarning("\n error bind programm shader\n");
	}
	/*program.setUniformValue("camera.pos", QVector3D(0.0, 0.0, -10));
	program.setUniformValue("camera.view", QVector3D(0.0, 0.0, 1.0));
	program.setUniformValue("camera.up", QVector3D(0.0, 1.0, 0.0));
	program.setUniformValue("camera.side", QVector3D(1.0, 0.0, 0.0));*/

	program.release();

	std::vector<Sphere> all_spheres;
	all_spheres.push_back(Sphere{ QVector3D(-2,0,1),2, QVector3D(1.0,0.4,1.0), 0 });
	all_spheres.push_back(Sphere{ QVector3D(-5,2,1),2, QVector3D(0.0,0.6,0.2), 0 });
	all_spheres.push_back(Sphere{ QVector3D(1,4,1),1, QVector3D(0.0,0.0,1.0), 0 });
	all_spheres.push_back(Sphere{ QVector3D(-1,-1,-1),1, QVector3D(1.0,0.0,0.0), 0 });
	all_spheres.push_back(Sphere{ QVector3D(1,-3,0),2, QVector3D(1.0,0.0,0.3), 0 });

	functions = QOpenGLContext::currentContext()->versionFunctions<QOpenGLFunctions_4_3_Core>();
	functions->glGenBuffers(1, &ssbo);//возвращает заданное кол-во неиспользуемых в настоящее время идентификаторов ssd
	functions->glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
	//выделение памяти и загрузка в нее даных
	functions->glBufferData(GL_SHADER_STORAGE_BUFFER, all_spheres.size() * sizeof(Sphere), all_spheres.data(), GL_DYNAMIC_COPY);
	functions->glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);
}

void ShaderWidget::resizeGL(int _width, int _height) {
	glViewport(0, 0, _width, _height);
	/*if (!program.bind()) {
		qWarning("\n error bind programm shader\n");
	}
	program.setUniformValue("scale", QVector2D(width(), height()));
	program.release();*/
}

void ShaderWidget::paintGL() {
	glClear(GL_COLOR_BUFFER_BIT);
	if (!program.bind()) {
		return;
	}
	program.enableAttributeArray(position);
	program.setAttributeArray(position, vert_data, 3);
	glDrawArrays(GL_QUADS, 0, 4);
	program.disableAttributeArray(position);
	program.setUniformValue("scale", QVector2D(width(), height()));//отвечает за соотношение сторон исходного окна
	program.setUniformValue("light_pos", QVector3D(x, y, z));
	program.setUniformValue("camera.pos", QVector3D(camera.pos.x(), camera.pos.y(), camera.pos.z()));
	program.setUniformValue("camera.view", QVector3D(camera.view.x(), camera.view.y(), camera.view.z()));
	program.setUniformValue("camera.up", QVector3D(camera.up.x(), camera.up.y(), camera.up.z()));
	program.setUniformValue("camera.side", QVector3D(camera.side.x(), camera.side.y(), camera.side.z()));

	program.release();
}

ShaderWidget::ShaderWidget(QWidget* parent) : QOpenGLWidget(parent) {
	position = 0;
	x = 20;
	y = 0;
	z = 0;
	vert_data = new GLfloat[12];
	//заполняем координатами вершин квада
	vert_data[0] = -1.0f;
	vert_data[1] = -1.0f;
	vert_data[2] = 0.0f;
	vert_data[3] = 1.0f;
	vert_data[4] = -1.0f;
	vert_data[5] = 0.0f;
	vert_data[6] = 1.0f;
	vert_data[7] = 1.0f;
	vert_data[8] = 0.0f;
	vert_data[9] = -1.0f;
	vert_data[10] = 1.0f;
	vert_data[11] = 0.0f;

	camera.pos.setX(0);
	camera.pos.setY(0);
	camera.pos.setZ(-10);
	camera.view.setX(0);
	camera.view.setY(0);
	camera.view.setZ(1);
	camera.up.setX(0);
	camera.up.setY(1);
	camera.up.setZ(0);
	camera.side.setX(1);
	camera.side.setY(0);
	camera.side.setZ(0);
}

ShaderWidget::~ShaderWidget() {
	delete[] vert_data;
}
void ShaderWidget::keyPressEvent(QKeyEvent* event) {
	if (event->nativeVirtualKey() == Qt::Key_U) {
		i++;
		camera.pos.setY(i);
	}
	if (event->nativeVirtualKey() == Qt::Key_D) {
		i--;
		camera.pos.setY(i);
	}
	if (event->nativeVirtualKey() == Qt::Key_T) {
		i++;
		camera.pos.setX(i);
	}
	if (event->nativeVirtualKey() == Qt::Key_R) {
		i--;
		camera.pos.setX(i);
	}
	if (event->nativeVirtualKey() == Qt::Key_I) {//лев
		i = 0;
		camera.pos.setX(-10);
		camera.pos.setY(0);
		camera.pos.setZ(0);
		camera.view.setX(1);
		camera.view.setY(0);
		camera.view.setZ(0);
		camera.up.setX(0);
		camera.up.setY(1);
		camera.up.setZ(0);
		camera.side.setX(0);
		camera.side.setY(0);
		camera.side.setZ(-1);
	}
	if (event->nativeVirtualKey() == Qt::Key_L) {//низ
		i = 0;
		camera.pos.setX(0);
		camera.pos.setY(-10);
		camera.pos.setZ(0);
		camera.view.setX(0);
		camera.view.setY(1);
		camera.view.setZ(0);
		camera.up.setX(0);
		camera.up.setY(0);
		camera.up.setZ(-1);
		camera.side.setX(1);
		camera.side.setY(0);
		camera.side.setZ(0);
	}
	if (event->nativeVirtualKey() == Qt::Key_P) {//прав
		i = 0;
		camera.pos.setX(10);
		camera.pos.setY(0);
		camera.pos.setZ(0);
		camera.view.setX(-1);
		camera.view.setY(0);
		camera.view.setZ(0);
		camera.up.setX(0);
		camera.up.setY(1);
		camera.up.setZ(0);
		camera.side.setX(0);
		camera.side.setY(0);
		camera.side.setZ(-1);
	}
	if (event->nativeVirtualKey() == Qt::Key_O) {//верх
		i = 0;
		camera.pos.setX(0);
		camera.pos.setY(10);
		camera.pos.setZ(0);
		camera.view.setX(0);
		camera.view.setY(-1);
		camera.view.setZ(0);
		camera.up.setX(0);
		camera.up.setY(0);
		camera.up.setZ(1);
		camera.side.setX(1);
		camera.side.setY(0);
		camera.side.setZ(0);
	}
	if (event->nativeVirtualKey() == Qt::Key_K) {//зад
		i = 0;
		camera.pos.setX(0);
		camera.pos.setY(0);
		camera.pos.setZ(10);
		camera.view.setX(0);
		camera.view.setY(0);
		camera.view.setZ(-1);
		camera.up.setX(0);
		camera.up.setY(1);
		camera.up.setZ(0);
		camera.side.setX(-1);
		camera.side.setY(0);
		camera.side.setZ(0);
	}
	if (event->nativeVirtualKey() == Qt::Key_Q) {//перед
		i = 0;
		camera.pos.setX(0);
		camera.pos.setY(0);
		camera.pos.setZ(-10);
		camera.view.setX(0);
		camera.view.setY(0);
		camera.view.setZ(1);
		camera.up.setX(0);
		camera.up.setY(1);
		camera.up.setZ(0);
		camera.side.setX(1);
		camera.side.setY(0);
		camera.side.setZ(0);
	}

	if (event->nativeVirtualKey() == Qt::Key_Y) {
		y = 0;
		if (k == 0) {
			x--;
			z = sqrt(400 - x * x);
		}
		if (k == 1) {
			x++;
			z = -sqrt(400 - x * x);
		}
		if (x == -20) k = 1;
		if (x == 20)k = 0;
	}
	if (event->nativeVirtualKey() == Qt::Key_X) {
		x = 0;
		if (k == 0) {
			y--;
			z = sqrt(400 - y * y);
		}
		if (k == 1) {
			y++;
			z = -sqrt(400 - y * y);
		}
		if (y == -20) k = 1;
		if (y == 20)k = 0;
	}
	if (event->nativeVirtualKey() == Qt::Key_Z) {
		z = 0;
		if (k == 0) {
			y--;
			x = sqrt(400 - y * y);
		}
		if (k == 1) {
			y++;
			x = -sqrt(400 - y * y);
		}
		if (y == -20) k = 1;
		if (y == 20)k = 0;
	}
	update();
}
