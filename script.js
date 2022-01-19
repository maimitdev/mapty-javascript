'use strict';
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const buttonEdit = document.querySelector('.edit_form');
// const select = document.querySelector('.form__input--type');
const cadence = document.querySelector('.form__input--cadence');

class Workout {
  date = new Date().toLocaleString('default', {
    month: 'long',
    day: 'numeric',
  });
  id = Date.now() + ''.slice(-10);
  test = inputType.value;
  constructor(coords, distance, duration) {
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lat, lng]
  }
}
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calPace(); //nen goi ntn k hieu vi sao
  }
  calPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calSpeed();
  }
  calSpeed() {
    // km/h -> min
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// Application
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  #map; // private inatnd
  #mapEvent;
  #workout = []; // new feature in js soon
  constructor() {
    // this.Workout = [];
    this._getPoisition();
    this._getLocalStore();

    form.addEventListener('submit', this._netWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevation);
    containerWorkouts.addEventListener('click', this._jumpToPopup.bind(this));
    buttonEdit.addEventListener('click', this._editWorkout.bind(this));
  }
  _getPoisition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('can not access location');
        }
      );
  }
  _loadMap(poisition) {
    const { latitude } = poisition.coords;
    const { longitude } = poisition.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map', {
      closePopupOnClick: false,
    }).setView(coords, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // click
    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(work => {
      this._renderWorkoutMarket(work);
    });
  }
  _toggleElevation() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _showForm(mapE) {
    this.#mapEvent = mapE; // copy to global event
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }
  _netWorkout(e) {
    e.preventDefault();
    // helper function
    const validInput = function (...inputs) {
      return inputs.every(inpu => Number.isFinite(inpu)); // false
    };
    const allPositive = function (...inputs) {
      return inputs.every(input => input > 0);
    }; // true or fasle
    // get data from form
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // check if data is valid
    // if workout running, create running object
    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('inout positive please');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout cycling, create cycling object
    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('inout positive please');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new object to workout array
    this.#workout.push(workout);
    // render workou on map as marker
    this._renderWorkouHtml(workout);
    this._renderWorkoutMarket(workout);
    this._hideForm();
    this._setStoreLocal();
    this._editWorkout();
  }
  _renderWorkoutMarket(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          className: `${workout.test}-popup`,
        })
      )
      .setPopupContent(
        `${workout.test[0].toUpperCase() + workout.test.slice(1)} on ${
          workout.date
        }`
      )
      .openPopup();
  }
  _renderWorkouHtml(workout) {
    let html = `
    
    <li class="workout workout--${workout.test}" data-id="${workout.id}">
    <h2 class="workout__title">${
      workout.test === 'running' ? 'Running' : 'Cycling'
    } on ${workout.date}</h2>
    <button class ="edit">Edit</button>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.test === 'running' ? '🏃' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.test === 'running')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value"></span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

    if (workout.test === 'cycling')
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    form.insertAdjacentHTML('afterend', html);
    this._hideForm();
  }
  _editWorkout(e) {
    // tim button chua class edit
    if (e.target.classList.contains('edit')) {
      // lay the co chua id atrubute
      const workoutEl = e.target.closest('.workout');
      // find id tung voi id cua workout objects
      const workoutEdit = this.#workout.find(
        work => work.id === workoutEl.dataset.id
      );
      // hien thi form
      form.classList.remove('hidden');
      this._toggleElevation();
      // chen du lieu vao form
      inputDistance.value = `${workoutEdit.distance}`;
      inputDuration.value = `${workoutEdit.duration}`;
      inputType.value = `${workoutEdit.test}`;
      console.log(workoutEdit);

      if (workoutEdit.test === 'running') {
        inputCadence.value = `${workoutEdit.cadence}`;
      }
      if (workoutEdit.test === 'cycling') {
        inputElevation.value = `${workoutEdit.elevation}`;
      }
      // update du lieu
    }
  }
  _update() {}
  _jumpToPopup(e) {
    const workoutEl = e.target.closest('.workout'); // lay element
    if (!workoutEl) return;
    // lay iD cua chinh thang con do

    // lay object cua no ra object cos id giong element tren
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout.coords);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setStoreLocal() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }
  _getLocalStore() {
    const data = JSON.parse(localStorage.getItem('workout'));
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach(work => {
      this._renderWorkouHtml(work);
    });
  }
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}
const app = new App();
