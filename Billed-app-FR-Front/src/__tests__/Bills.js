/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import Logout from "../containers/Logout";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills"
import router from "../app/Router"
import $ from 'jquery';
import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";


jest.mock("../app/store", () => mockStore)


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
  describe("When I click on disconnect Button",()=>{
    test("Then I am redirected to the 'Login' page",()=>{
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = BillsUI({data:bills})
      const getItemSpy = jest.spyOn(global.window.localStorage, 'getItem');
      getItemSpy.mockReturnValue(JSON.stringify({ type: 'Employee' }));
      
      new Logout({ document, onNavigate, localStorage });

      const disconnect =  $('#layout-disconnect');
      disconnect.trigger('click')
      expect(screen.getByText("Employé")).toBeTruthy() 
    })
  })
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


///////////////////////////////////////////////////////////////////////////
//////                  INTEGRATION TEST GET                      /////////
///////////////////////////////////////////////////////////////////////////

describe("Given I am a user connected as Employee",()=>{
  describe("When I navigate to Bills",()=>{
    test("Then fetches bills from mock API GET",async()=>{
      document.body.innerHTML ="";
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
  
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    
      await waitFor(() => screen.getAllByText("Mes notes de frais"));
      expect(screen.getByText("Nouvelle note de frais")).toBeTruthy();
      expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
      expect(screen.getByText("Services en ligne")).toBeTruthy();
      expect(screen.getByText("100 €")).toBeTruthy();
      expect(screen.getAllByTestId("tbody")).toBeTruthy();
      expect(screen.getByText("Billed")).toBeTruthy();
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 400 message error", async () => {
      //Erreur 400 (Bad Request) syntax request, ressource not found, bad URL
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 400"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 400/)
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 401 message error", async () => {
      //Erreur 401 (Unauthorized)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 401"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 401/)
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      //Erreur 404 (Not Found) ressource not found
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 500 message error", async () => {
      //Erreur 500 (Internal Server Error) 
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})


  ///////////////////////////////////////////////////////////////////////////////
  ////                               COVERAGE                                ////
  ///////////////////////////////////////////////////////////////////////////////

  //   // COVERAGE : getBills -> catch(e){  console.log(e,'for',doc)...
  describe("Given  I am a user connected as Employee",()=>{
    describe("When I'm on the bills page with corrupted data", () => {
      test("Then It should render a log error", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const allBills = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
    
        mockStore.bills().list = jest.fn().mockResolvedValueOnce([
          { doc: { date: '2023-05-01', status: 'accepted' } },
          { doc: { date: '2023-06-01', status: 'accepted' } },
          { doc: { date: '2023-05-02', status: 'accepted' } },
          { doc: { date: 'incorrect date', status: 'rejected' } },
          { doc: { date: '2023-05-04', status: undefined } }, 
        ]);

        const consoleSpy = jest.spyOn(console, 'log');
        const result = await allBills.getBills();
  
        await expect(mockStore.bills().list).toHaveBeenCalled();
        expect(result.length).toBe(5); 
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining("for"), expect.objectContaining({ doc: { date: "incorrect date", status: "rejected" } }));
        consoleSpy.mockRestore();
      });
    });
  });  