/**
 * @jest-environment jsdom
 */

import { screen,fireEvent, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill, {updateBill} from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I visualize the form 'Send a Bills'", () => {
      document.body.innerHTML =  NewBillUI()
      const form = screen.getByText("Envoyer une note de frais")
      expect(form).toBeTruthy()
    })
  })
})
describe("Given I am connected as an employee, I am on NewBill Page",()=>{
  describe("When I click on the 'Back' button of the browser",()=>{
    test("Then I am redirected to the Bills page",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      window.onNavigate(ROUTES_PATH.NewBill)

      const PREVIOUS_LOCATION ='#employee/bills';
  
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

  describe("When I do not fill in the fields of the required form, I click on the 'Send' button",()=>{
    test("Then I am told to fill in the required fields, I still stay on form",()=>{
      document.body.innerHTML=NewBillUI();

      const form = screen.getByTestId("form-new-bill")
      const buttonNewBill = jest.fn((e) => e.preventDefault())
      form.addEventListener("submit", buttonNewBill)
      fireEvent.submit(form)

      expect(form).toBeTruthy()
      expect((screen.getByTestId("expense-name")).value).toBe('')
      expect((screen.getByTestId("amount")).value).toBe('')
      expect((screen.getByTestId("commentary")).value).toBe('')
      expect((screen.getByTestId("vat")).value).toBe('')
      expect((screen.getByTestId("pct")).value).toBe('')
      expect(document.getElementById("btn-send-bill")).toBeTruthy()
    })
  })

  describe("When I fill out the form with the wrong file format",()=>{
    test("Then I receive an alert message and I can't click the 'Submit' button",()=>{
      document.body.innerHTML =NewBillUI() 
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({ document, onNavigate, store:null, localStorage: window.localStorage })

      const downloadFile = jest.fn((e) => newBill.handleChangeFile(e))
      window.alert = jest.fn();

      const file = screen.getByTestId("file")
      const myTestFile = new File(["blablabla"], "monfichier.txt", { type: "text/plain" })
      file.addEventListener("change",downloadFile)
      fireEvent.change(file, {target: {files: [myTestFile]}})

      expect(downloadFile).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Format de fichier invalide, merci de charger un fichier de type image [jpg/jpeg/png]"))
      const buttonSubmit = screen.getByText("Envoyer")
      expect(buttonSubmit.disabled).toBe(true)
    })
  })

  describe("When I fill in the form with a good file format (jpg,jpeg,png,gif), I can click on the 'Send' button",()=>{
    test("Then I am redirected to the Bills page with display of the new 'Bill' with a 'pending' status", ()=>{
      document.body.innerHTML =NewBillUI() 
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({ document, onNavigate, store:mockStore, localStorage: window.localStorage })

      const downloadFile = jest.fn((e) => newBill.handleChangeFile(e))
      const file = screen.getByTestId("file")
      const myTestFile = new File([""], "monfichier.jpg", { type: "image/jpg" })
      file.addEventListener("change",downloadFile)
      fireEvent.change(file, {target: {files: [myTestFile]}})
     
      expect(downloadFile).toHaveBeenCalled()
      const btnSendBill = screen.getByText("Envoyer")
      expect(btnSendBill.disabled).toBe(false)

      const formNewBill = screen.getByTestId("form-new-bill")

      userEvent.selectOptions(formNewBill.querySelector(`select[data-testid="expense-type"]`), 'Transports')
      userEvent.type(formNewBill.querySelector(`input[data-testid="expense-name"]`), 'Apero collègue')
      userEvent.type(formNewBill.querySelector(`input[data-testid="amount"]`), '100')
      userEvent.type(formNewBill.querySelector(`input[data-testid="vat"]`), '20')
      userEvent.type(formNewBill.querySelector(`input[data-testid="pct"]`), '10')
      userEvent.type(formNewBill.querySelector(`textarea[data-testid="commentary"]`), 'C\'était cool !!')
      const dateInput = formNewBill.querySelector(`input[data-testid="datepicker"]`)
      dateInput.setAttribute('value', '2020-05-01')
      userEvent.click(dateInput);

      const updateBillSpy = jest.spyOn(newBill, "updateBill")
      const handleSubmit = jest.spyOn(newBill,"handleSubmit")

      handleSubmit({
        preventDefault: jest.fn(),
        target: formNewBill,
      })
      expect(handleSubmit).toHaveBeenCalled()
      expect(updateBillSpy).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()

      const updateBillArgs = updateBillSpy.mock.calls[0]
      const [billData] = updateBillArgs
      expect(billData.name).toBe('Apero collègue')
      expect(billData.status).toBe('pending')
    })
  })
})
 

// ///////////////////////////////////////////////////////////////////////////
// //////                  INTEGRATION TEST POST                     /////////
// ///////////////////////////////////////////////////////////////////////////

 describe("Given I am a user connected as Employee",()=>{
  describe("When I submit Form",()=>{
    test("Then the Bill is create with success, POST(201)", ()=>{
      document.body.innerHTML = NewBillUI()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })}
      window.alert = jest.fn();
      
      const newBill= new NewBill({ document, onNavigate, store:mockStore, localStorage: window.localStorage })

      const file = screen.getByTestId("file")
      const myTestFile = new File([""], "monfichier.jpg", { type: "image/jpg" })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const createSpy = jest.spyOn(mockStore.bills(), 'create')

      file.addEventListener("change",handleChangeFile)
      fireEvent.change(file, {target: {files: [myTestFile]}})

      expect(handleChangeFile).toHaveBeenCalled()
      expect(window.alert).not.toHaveBeenCalled()
      expect(createSpy).toHaveBeenCalled()
 
      const formNewBill = screen.getByTestId("form-new-bill")
      userEvent.selectOptions(formNewBill.querySelector(`select[data-testid="expense-type"]`), 'Transports')
      userEvent.type(formNewBill.querySelector(`input[data-testid="expense-name"]`), 'Apero collègue')
      userEvent.type(formNewBill.querySelector(`input[data-testid="amount"]`), '100')
      userEvent.type(formNewBill.querySelector(`input[data-testid="vat"]`), '20')
      userEvent.type(formNewBill.querySelector(`input[data-testid="pct"]`), '10')
      userEvent.type(formNewBill.querySelector(`textarea[data-testid="commentary"]`), 'C\'était cool !!')
      const dateInput = formNewBill.querySelector(`input[data-testid="datepicker"]`)
      dateInput.setAttribute('value', '2020-05-01')
      userEvent.click(dateInput);

      const handleSubmit = jest.spyOn(newBill,"handleSubmit")
      const updateBillSpy = jest.spyOn(newBill, 'updateBill')

      handleSubmit({
        preventDefault: jest.fn(),
        target: formNewBill,
      })
      expect(handleSubmit).toHaveBeenCalled()
      expect(updateBillSpy).toHaveBeenCalled()
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
  })

  describe("When an error occurs on API",()=>{
    test("fetches messages from an API POST and fails with 404 message error",() => {
      //Erreur 404 (Not Found) ressource not found
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })}

      document.body.innerHTML=NewBillUI();

      const newBill = new NewBill({ document, onNavigate, store:{
        bills: jest.fn(() => ({
        create: jest.fn(() => Promise.reject(new Error('Erreur 404')))
      }))}, localStorage:window.localStorage });

      const consoleErrorMock = jest.spyOn(console, 'error')

      const event = { preventDefault: jest.fn()}

      try {
        newBill.handleChangeFile(event)
      } catch (error) {
        expect(error.message).toBe('Erreur 404')
        expect(consoleErrorMock).toHaveBeenCalledWith(error)
      }
      consoleErrorMock.mockRestore()
    })

    test("fetches messages from an API POST and fails with 500 message error",() => {
      // Erreur 500 (Internal Server Error)
      document.body.innerHTML=NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })}
      const consoleErrorMock = jest.spyOn(console, 'error')
      const newBill = new NewBill({ document, onNavigate, store:{
          bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error('Erreur 500')))
        }))}, localStorage: window.localStorage })

      const fileName = 'test.jpg';
      const file = new File([''], fileName, { type: 'image/jpeg' })
      newBill.document.querySelector = jest.fn().mockReturnValue({
        files: [file]
      });

      const btnSendBill = newBill.document.getElementById('btn-send-bill');
      expect(btnSendBill.disabled).toBe(false);
        
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\test\\test.jpg'
        }
      };
      try {
        newBill.handleChangeFile(event)
      } catch (error) {
        expect(error.message).toBe('Erreur 500')
        expect(consoleErrorMock).toHaveBeenCalledWith(error)
        expect(btnSendBill.disabled).toBe(true)
      }
        consoleErrorMock.mockRestore()
    });
  })

})


