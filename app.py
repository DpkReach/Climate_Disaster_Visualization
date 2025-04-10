from flask import Flask, render_template
import pandas as pd

app = Flask(__name__)

@app.route('/')
def index():
    df = pd.read_csv('DV_ClimateChange.csv')
    data = df.to_dict(orient='records')
    return render_template('index.html', data=data)

@app.route('/trends')
def trends():
    return render_template('trends.html')

@app.route('/climate')
def climate():
    return render_template('climate.html')

@app.route('/map')
def map():
    return render_template('map.html')

@app.route('/bar')
def bar():
    return render_template('bar.html')

@app.route('/pie')
def pie():
    return render_template('pie.html')

@app.route('/stacked')
def stacked():
    return render_template('stacked.html')

@app.route('/scatterplot')
def scatterplot():
    return render_template('scatter.html')

@app.route('/race')
def race():
    return render_template('race.html')

@app.route('/treemap')
def treemap():
    return render_template('treemap.html')

@app.route('/severity')
def severity():
    return render_template('severity.html')

@app.route('/tableau1')
def tableau1():
    return render_template('tableau1.html')

@app.route('/tableau2')
def tableau2():
    return render_template('tableau2.html')


if __name__ == '__main__':
    app.run(debug=True)
