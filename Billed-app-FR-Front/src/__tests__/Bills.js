/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import Logout from "../containers/Logout";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
jest.mock("../app/store", () => mockStore)
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on the 'New Bill' button",()=>{
    test("Then I am directed to the NewBill page",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router()
      window.onNavigate(ROUTES_PATH.Bills);

      const handleClickNewBill = jest.fn();
      const buttonNewBill = screen.getByTestId('btn-new-bill');
      buttonNewBill.addEventListener('click', handleClickNewBill);
      userEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
})

describe("Given I am connected as an employee, I am on Bill page", () => {
  describe("When I click on the 'Back' button of the browser",()=>{
    test("Then I stay on Bills page",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const PREVIOUS_LOCATION ='/';
      
            window.onpopstate = (e) => {
              const user = JSON.parse(localStorage.getItem('user'))
              if (window.location.pathname === "/" && !user) {
                document.body.style.backgroundColor="#0E5AE5"
                root.innerHTML = ROUTES({ pathname: window.location.pathname })
              }
              else if (user) {
                onNavigate(PREVIOUS_LOCATION)
              }
            }
        window.onpopstate();
        expect(document.body.innerHTML).toContain('Mes notes de frais');
    })
  })

  describe("When I click on the iconEye of one of the expense reports",()=>{
    test("Then A modal opens displaying the Proof of the expense report",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router()
      window.onNavigate(ROUTES_PATH.Bills);
      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn();
      const iconEyes = screen.getAllByTestId("icon-eye");
      if (iconEyes.length > 0) {
        const firstIconEyes = iconEyes[0]
        firstIconEyes.addEventListener("click", () => handleClickIconEye(firstIconEyes));
        userEvent.click(firstIconEyes);
        expect(handleClickIconEye).toHaveBeenCalled();
        expect($.fn.modal).toHaveBeenCalled();
      }
      expect(screen.getByText("Justificatif")).toBeTruthy();
    })
  })
  // describe("When I click on disconnect Button",()=>{
  //   test("Then I am redirected to the 'Login' page",()=>{
  //     const onNavigate = (pathname) => {
  //       document.body.innerHTML = ROUTES({ pathname })
  //     }
  //     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  //     window.localStorage.setItem('user', JSON.stringify({
  //       type: 'Employee'
  //     }))
  //     document.body.innerHTML = BillsUI({ data:bills })
  //     const userData = window.localStorage.getItem('user');
  //     expect(userData).toBeDefined();
  //     console.log(JSON.parse(userData));
  //     const logout = new Logout({ document, onNavigate, localStorage })
  //     const disconnect = document.getElementById('layout-disconnect')
  //     const handleClick = jest.fn(logout.handleClick)
  //     disconnect.addEventListener('click', handleClick)
  //     userEvent.click(disconnect)
  //     expect(handleClick).toHaveBeenCalled()
  //     expect(screen.getByText('Employé')).toBeTruthy()
  //   })
  // })
})

describe("Given I am connected as an employee, on Bills Page, and I click on EyeIcon",()=>{
  describe("When I click on the closing 'Cross'",()=>{
    test("Then the modal disappear",()=>{
      document.body.innerHTML=BillsUI({data:bills});
      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn();
      const firstIconEyes = screen.getAllByTestId("icon-eye")[0];
      firstIconEyes.addEventListener("click", () => handleClickIconEye(firstIconEyes));
      fireEvent.click(firstIconEyes);

      const modalClose = document.body.querySelector('.close')
      const clickHandlerClose = jest.fn();
      modalClose.addEventListener('click', clickHandlerClose);
      userEvent.click(modalClose);
      const modalContainer = document.body.querySelector('.modal')
      expect(modalContainer.classList.contains('show')).toBeFalsy();
    })
  })
})